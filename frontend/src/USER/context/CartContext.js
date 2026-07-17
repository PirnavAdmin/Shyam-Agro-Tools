import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useToast } from './ToastContext';
import { useLanguage } from './LanguageContext';
import {
  addCartItem,
  clearCartItems,
  deleteCartItem,
  getCart,
  updateCartItem,
} from '../../services/cartCheckoutService';
import { getProducts } from '../../services/productService';
import { useAuth } from './AuthContext';
import { getProductImage } from '../../utils/productImage';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const getCartProductId = (item = {}) => (
  item.productId ??
  item.ProductId ??
  item.product?.id ??
  item.product?.productId ??
  item.product?.ProductId ??
  item.id
);

const getCartId = (item = {}) => (
  item.cartId ??
  item.cartItemId ??
  item.CartId ??
  item.CartItemId ??
  item.id ??
  item.Id
);

const mapCartItems = (items, products) => {
  const productsById = new Map(products.map((product) => [String(product.id), product]));

  return items.map((cartItem) => {
    const productId = getCartProductId(cartItem);
    const product = productsById.get(String(productId)) || cartItem.product || {};
    const quantity = Math.max(1, Number(cartItem.quantity ?? cartItem.Quantity ?? 1) || 1);
    const price = Number(cartItem.price ?? cartItem.Price ?? product.price ?? product.sellingPrice ?? 0);
    const totalPrice = Number(cartItem.totalPrice ?? 0);
    const totalAmount = Number(cartItem.totalAmount ?? cartItem.TotalAmount ?? price * quantity);
    const lineTotal = totalPrice > 0 ? totalPrice : totalAmount;

    return {
      ...product,
      cartId: getCartId(cartItem),
      productId,
      id: String(productId),
      quantity,
      price,
      lineTotal,
      totalAmount,
      createdDate: cartItem.createdDate || cartItem.CreatedDate,
      name: product.name || product.productName || cartItem.productName || `Product ${productId}`,
      displayName: product.displayName || product.productName || product.name || cartItem.productName || `Product ${productId}`,
      image: getProductImage({ ...cartItem, ...product }),
      sku: product.sku || String(productId),
      rawCartItem: cartItem,
    };
  });
};

const toCartPayload = (item, quantity = item.quantity) => ({
  cartId: Number(getCartId(item) || 0),
  productId: Number(getCartProductId(item)),
  quantity: Math.max(1, Number(quantity) || 1),
  price: Number(item.price || 0),
  totalAmount: Number(item.price || 0) * Math.max(1, Number(quantity) || 1),
  createdDate: item.createdDate || new Date().toISOString(),
});

let initialCartDataRequest;

const getInitialCartData = () => {
  if (!initialCartDataRequest) {
    initialCartDataRequest = Promise.all([getCart(), getProducts()])
      .finally(() => {
        initialCartDataRequest = null;
      });
  }
  return initialCartDataRequest;
};

export const CartProvider = ({ children }) => {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const { isLoggedIn, loading: isAuthLoading } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [isCartMutating, setIsCartMutating] = useState(false);
  const [cartError, setCartError] = useState('');
  const productsRef = useRef([]);
  const cartItemsRef = useRef([]);
  const mutationQueueRef = useRef(Promise.resolve());
  const cartReadyPromiseRef = useRef(Promise.resolve());

  const setLiveCartItems = useCallback((itemsOrUpdater) => {
    const nextItems = typeof itemsOrUpdater === 'function'
      ? itemsOrUpdater(cartItemsRef.current)
      : itemsOrUpdater;
    cartItemsRef.current = nextItems;
    setCartItems(nextItems);
  }, []);

  const queueCartMutation = useCallback((mutation) => {
    const operation = mutationQueueRef.current.then(mutation, mutation);
    mutationQueueRef.current = operation.catch(() => undefined);
    return operation;
  }, []);

  const waitForCartSync = useCallback(() => mutationQueueRef.current, []);

  useEffect(() => {
    let isActive = true;

    const loadCart = async () => {
      if (isAuthLoading) return;
      setIsCartLoading(true);
      setCartError('');

      if (!isLoggedIn) {
        if (isActive) {
          setLiveCartItems([]);
          setIsCartLoading(false);
        }
        return;
      }

      const initialRequest = getInitialCartData();
      cartReadyPromiseRef.current = initialRequest.catch(() => undefined);

      try {
        const [items, products] = await initialRequest;
        if (!isActive) return;
        productsRef.current = products;

        setLiveCartItems(mapCartItems(items, products));
      } catch (error) {
        console.error('Unable to load cart from server.', error);
        if (isActive) {
          setLiveCartItems([]);
          setCartError('Unable to load cart. Please try again.');
        }
      } finally {
        if (isActive) setIsCartLoading(false);
      }
    };

    loadCart();
    return () => {
      isActive = false;
    };
  }, [isAuthLoading, isLoggedIn, setLiveCartItems]);

  const refreshCart = useCallback(async () => {
    try {
      const items = await getCart();
      setLiveCartItems(mapCartItems(items, productsRef.current));
      setCartError('');
      return items;
    } catch (error) {
      console.error('Unable to refresh cart.', error);
      setCartError('Unable to load cart. Please try again.');
      throw error;
    }
  }, [setLiveCartItems]);

  const addToCart = (product, quantityToAdd = 1) => {
    if (!product?.id) {
      showToast(t('unableAddProductToCart'), 'error');
      return Promise.resolve(false);
    }

    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized', {
        detail: { returnTo: `${window.location.pathname}${window.location.search}${window.location.hash}` },
      }));
      return Promise.resolve(false);
    }

    if (!productsRef.current.some((item) => String(item.id) === String(product.id))) {
      productsRef.current = [...productsRef.current, product];
    }

    const amount = Math.max(1, Number(quantityToAdd) || 1);

    return queueCartMutation(async () => {
      await cartReadyPromiseRef.current;
      setIsCartMutating(true);
      try {
        await addCartItem({ productId: Number(product.id), quantity: amount });
        await refreshCart();
        setCartError('');
        showToast(t('addedToCartStandalone'));
        return true;
      } catch (error) {
        console.error('Unable to add product to cart.', error.response?.data || error);
        setCartError('Unable to add this product. Please try again.');
        showToast('Unable to add product to cart.', 'error');
        return false;
      } finally {
        setIsCartMutating(false);
      }
    });
  };

  const removeFromCart = (productId) => {
    return queueCartMutation(async () => {
      const previousItems = cartItemsRef.current;
      const itemToRemove = previousItems.find((item) => item.id === String(productId));
      if (!itemToRemove) return false;

      setIsCartMutating(true);
      try {
        await deleteCartItem(itemToRemove.cartId);
        await refreshCart();
        setCartError('');
        return true;
      } catch (error) {
        console.error('Unable to remove cart item.', error);
        setCartError('Unable to remove this item. Please try again.');
        return false;
      } finally {
        setIsCartMutating(false);
      }
    });
  };

  const updateQuantity = (productId, delta) => {
    const amount = Number(delta) || 0;

    return queueCartMutation(async () => {
      const previousItems = cartItemsRef.current;
      const itemToUpdate = previousItems.find((item) => item.id === String(productId));
      if (!itemToUpdate) return false;

      const quantity = itemToUpdate.quantity + amount;
      setIsCartMutating(true);
      try {
        if (quantity < 1) await deleteCartItem(itemToUpdate.cartId);
        else await updateCartItem(itemToUpdate.cartId, toCartPayload(itemToUpdate, quantity));
        await refreshCart();
        setCartError('');
        return true;
      } catch (error) {
        console.error('Unable to update cart quantity.', error);
        setCartError('Unable to update quantity. Please try again.');
        return false;
      } finally {
        setIsCartMutating(false);
      }
    });
  };

  const clearCart = () => {
    setIsCartMutating(true);
    queueCartMutation(async () => {
      await clearCartItems();
      await refreshCart();
    })
      .catch((error) => {
        console.error('Unable to clear the server cart.', error);
        setCartError('Unable to clear cart. Please try again.');
      })
      .finally(() => setIsCartMutating(false));
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.lineTotal, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartSubtotal,
      isCartLoading,
      isCartMutating,
      cartError,
      refreshCart,
      waitForCartSync,
    }}>
      {children}
    </CartContext.Provider>
  );
};
