import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { getProducts, normalizeProduct } from '../../services/productService';
import {
  addToWishlist as addWishlistRequest,
  clearWishlist as clearWishlistRequest,
  getWishlist,
  removeFromWishlist as removeWishlistRequest,
} from '../../services/wishlistService';

const STORAGE_KEY = 'Agro_wishlist';
const WishlistContext = createContext();

const getProductSource = (item) =>
  item?.product ||
  item?.Product ||
  item?.productDetails ||
  item?.ProductDetails ||
  item;

const getProductId = (item) =>
  item?.product?.id ??
  item?.product?.productId ??
  item?.Product?.id ??
  item?.Product?.productId ??
  item?.Product?.ProductId ??
  item?.productId ??
  item?.ProductId ??
  item?.id ??
  item?.Id;

const getResponseItems = (data) => {
  if (Array.isArray(data)) return data;
  return data?.wishlistItems || data?.items || data?.wishlist || data?.value || [];
};

const normalizeItems = (items) => {
  const seen = new Set();
  return items.flatMap((entry) => {
    const source = getProductSource(entry);
    const id = getProductId(entry);
    if (id === undefined || id === null || seen.has(String(id))) return [];
    seen.add(String(id));
    return [normalizeProduct({ ...source, id, productId: id })];
  });
};

const getErrorStatus = (error) => error?.response?.status;

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const { isLoggedIn, loading: authLoading, token, user } = useAuth();
  const userPhone = user?.phone || '';
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const pendingRequestsRef = useRef(new Set());
  const pendingGuestActionsRef = useRef(new Map());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const hydrateWishlist = useCallback(async (rawItems) => {
    const normalized = normalizeItems(rawItems);
    const needsProducts = normalized.some((item) => (
      (!item.name && !item.displayName) ||
      Number(item.price ?? item.sellingPrice ?? 0) <= 0 ||
      !item.sku
    ));
    if (!needsProducts) return normalized;

    const products = await getProducts();
    const productsById = new Map(products.map((product) => [String(product.id), product]));
    return normalized.map((item) => {
      const product = productsById.get(String(item.id));
      if (!product) return item;
      return normalizeProduct({ ...item, ...product, id: item.id, productId: item.productId });
    });
  }, []);

  const refreshWishlist = useCallback(async () => {
    if (!isLoggedIn || !token || !userPhone) {
      if (mountedRef.current) setWishlistItems([]);
      return [];
    }

    setLoading(true);
    try {
      const response = await getWishlist(userPhone);
      const items = await hydrateWishlist(getResponseItems(response));
      if (mountedRef.current) setWishlistItems(items);
      return items;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [hydrateWishlist, isLoggedIn, token, userPhone]);

  const performPendingActions = useCallback(async () => {
    const actions = [...pendingGuestActionsRef.current.values()];
    pendingGuestActionsRef.current.clear();
    for (const action of actions) {
      if (action.type === 'remove') await removeWishlistRequest(action.productId, userPhone);
      else await addWishlistRequest(action.productId, userPhone);
    }
  }, [userPhone]);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn || !token || !userPhone) {
      setWishlistItems([]);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    let active = true;
    const synchronize = async () => {
      try {
        await performPendingActions();
        if (active) await refreshWishlist();
      } catch (error) {
        if (active && ![401, 403].includes(getErrorStatus(error))) setWishlistItems([]);
      }
    };
    synchronize();
    return () => {
      active = false;
    };
  }, [authLoading, isLoggedIn, performPendingActions, refreshWishlist, token, userPhone]);

  useEffect(() => {
    if (isLoggedIn && token) localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlistItems));
  }, [isLoggedIn, token, wishlistItems]);

  const isInWishlist = useCallback(
    (productId) => wishlistItems.some((item) => String(item.id) === String(productId)),
    [wishlistItems]
  );

  const addToWishlist = useCallback(async (product) => {
    const productId = getProductId(product);
    if (productId === undefined || productId === null) return false;
    const key = `add:${productId}`;
    if (pendingRequestsRef.current.has(key) || isInWishlist(productId)) return true;

    if (!isLoggedIn || !token || !userPhone) {
      pendingGuestActionsRef.current.set(String(productId), { type: 'add', productId, product });
      window.dispatchEvent(new CustomEvent('auth:unauthorized', {
        detail: { returnTo: `${window.location.pathname}${window.location.search}${window.location.hash}` },
      }));
      return 'login-required';
    }

    pendingRequestsRef.current.add(key);
    setWishlistItems((items) => normalizeItems([...items, product]));
    try {
      await addWishlistRequest(productId, userPhone);
      return true;
    } catch (error) {
      if ([401, 403].includes(getErrorStatus(error))) {
        pendingGuestActionsRef.current.set(String(productId), { type: 'add', productId, product });
        return 'login-required';
      }
      if (getErrorStatus(error) === 400 || getErrorStatus(error) === 409) return true;
      setWishlistItems((items) => items.filter((item) => String(item.id) !== String(productId)));
      return false;
    } finally {
      pendingRequestsRef.current.delete(key);
    }
  }, [isInWishlist, isLoggedIn, token, userPhone]);

  const removeFromWishlist = useCallback(async (productId) => {
    const key = `remove:${productId}`;
    if (pendingRequestsRef.current.has(key)) return false;
    const previous = wishlistItems;
    pendingRequestsRef.current.add(key);
    setWishlistItems((items) => items.filter((item) => String(item.id) !== String(productId)));
    try {
      await removeWishlistRequest(productId, userPhone);
      return true;
    } catch (error) {
      if ([401, 403].includes(getErrorStatus(error))) {
        pendingGuestActionsRef.current.set(String(productId), { type: 'remove', productId });
        return 'login-required';
      }
      setWishlistItems(previous);
      return false;
    } finally {
      pendingRequestsRef.current.delete(key);
    }
  }, [userPhone, wishlistItems]);

  const toggleWishlist = useCallback(async (product) => {
    if (!product?.id) return 'error';
    if (isInWishlist(product.id)) {
      const removed = await removeFromWishlist(product.id);
      return removed === true ? 'removed' : removed;
    }
    const added = await addToWishlist(product);
    return added === true ? 'added' : added;
  }, [addToWishlist, isInWishlist, removeFromWishlist]);

  const clearWishlist = useCallback(async () => {
    const previous = wishlistItems;
    setWishlistItems([]);
    try {
      await clearWishlistRequest(userPhone);
      return true;
    } catch {
      setWishlistItems(previous);
      return false;
    }
  }, [userPhone, wishlistItems]);

  const wishlistIds = useMemo(() => new Set(wishlistItems.map((item) => String(item.id))), [wishlistItems]);
  const value = useMemo(() => ({
    wishlist: wishlistItems,
    wishlistItems,
    wishlistIds,
    wishlistCount: wishlistItems.length,
    loading,
    isWishlisted: isInWishlist,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    refreshWishlist,
    clearWishlist,
  }), [addToWishlist, clearWishlist, isInWishlist, loading, refreshWishlist, removeFromWishlist, toggleWishlist, wishlistIds, wishlistItems]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
