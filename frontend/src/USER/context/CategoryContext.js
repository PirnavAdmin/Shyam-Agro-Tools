import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../../services/categoryService';
import {
  createSubcategory,
  deleteSubcategory,
  getSubcategories,
  mapCategoriesWithSubcategories,
  updateSubcategory,
} from '../../services/subcategoryService';

const CategoryContext = createContext(null);

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [subcategoriesError, setSubcategoriesError] = useState('');

  const refreshCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError('');

    try {
      setCategories(await getCategories());
    } catch (error) {
      console.error('Failed to load categories', error);
      setCategories([]);
      setCategoriesError('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const refreshSubcategories = useCallback(async () => {
    setSubcategoriesLoading(true);
    setSubcategoriesError('');

    try {
      setSubcategories(await getSubcategories());
    } catch (error) {
      console.error('Failed to load subcategories', error);
      setSubcategories([]);
      setSubcategoriesError('Failed to load subcategories');
    } finally {
      setSubcategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCategories();
    refreshSubcategories();
  }, [refreshCategories, refreshSubcategories]);

  const mappedCategories = useMemo(
    () => mapCategoriesWithSubcategories(categories, subcategories),
    [categories, subcategories]
  );

  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'development' ||
      categoriesLoading ||
      subcategoriesLoading
    ) {
      return;
    }

    console.table(categories);
    console.table(subcategories);
    console.table(mappedCategories);
  }, [
    categories,
    categoriesLoading,
    mappedCategories,
    subcategories,
    subcategoriesLoading,
  ]);

  const runCategoryMutation = useCallback(async (operation) => {
    const result = await operation();
    await refreshCategories();
    return result;
  }, [refreshCategories]);

  const runSubcategoryMutation = useCallback(async (operation) => {
    const result = await operation();
    await refreshSubcategories();
    return result;
  }, [refreshSubcategories]);

  const value = useMemo(() => ({
    categories,
    subcategories,
    mappedCategories,
    activeSubcategories: subcategories.filter((item) => item.isActive === true),
    categoriesLoading,
    subcategoriesLoading,
    categoriesError,
    subcategoriesError,
    refreshCategories,
    refreshSubcategories,
    createCategory: (data) => runCategoryMutation(() => createCategory(data)),
    updateCategory: (id, data) =>
      runCategoryMutation(() => updateCategory(id, data)),
    deleteCategory: (id) => runCategoryMutation(() => deleteCategory(id)),
    createSubcategory: (data) =>
      runSubcategoryMutation(() => createSubcategory(data)),
    updateSubcategory: (id, data) =>
      runSubcategoryMutation(() => updateSubcategory(id, data)),
    deleteSubcategory: (id) =>
      runSubcategoryMutation(() => deleteSubcategory(id)),
  }), [
    categories,
    categoriesError,
    categoriesLoading,
    mappedCategories,
    refreshCategories,
    refreshSubcategories,
    runCategoryMutation,
    runSubcategoryMutation,
    subcategories,
    subcategoriesError,
    subcategoriesLoading,
  ]);

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used inside CategoryProvider');
  }
  return context;
};
