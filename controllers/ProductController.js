import productModel from "../models/product-model.js";
import shopModel from "../models/shop-model.js";
import upload from "../middleware/s3.upload.js";
import categoryModel from "../models/category-model.js";

export const getAllProducts = async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query; // Get pagination parameters
    const skip = (page - 1) * limit; // Calculate how many documents to skip

    // Base query
    const baseQuery = productModel
      .find({})
      .sort({ createdAt: -1 })
      .populate("category")
      .skip(skip)
      .limit(parseInt(limit));
      
    // Count total products for pagination info
    const totalProducts = await productModel.countDocuments();
    
    // Get paginated products
    const products = await baseQuery;

    if (query) {
      const filteredProducts = filterProducts(query, products);
      res.json({
        products: filteredProducts,
        totalPages: Math.ceil(filteredProducts.length / limit),
        currentPage: parseInt(page),
        totalProducts: filteredProducts.length
      });
    } else {
      res.json({
        products,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: parseInt(page),
        totalProducts
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: error.message });
  }
};

export const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await shopModel.findById(id);

    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Магазины не найдена" });
    }
    console.log(store);
    res.status(200).json(store);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const filterProducts = (query, products) => {
  const regex = new RegExp(query, "i"); // 'i' — флаг для нечувствительности к регистру
  return products.filter(
    (product) =>
      regex.test(product.title) ||
      regex.test(product.category) ||
      regex.test(product.description)
  );
};

// export const searchProduct = async (req, res) => {
//   try {
//     const { query } = req.query; // Извлекаем параметр поиска
//     if (query) {
//       const filteredProducts = filterProducts(query);
//       res.json(filteredProducts);
//     } else {
//       res.json(products); // Возвращаем все товары, если нет запроса
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };

// Создание товара
export const createProduct = async (req, res) => {
  try {
    const { storeId } = req.params; // Получаем storeId из URL
    const {
      title,
      price,
      description,
      categoryId,
      imagesUrl,
      stock,
      parentId,
    } = req.body;
    // Проверяем, существует ли магазин
    const store = await shopModel.findById(storeId);
    // const category = await categoryModel.findById(categoryId);

    if (!store) {
      return res.status(404).json({ message: "Магазин не найден" });
    }
    console.log(imagesUrl);
    // Создаём продукт
    const newProduct = await productModel.create({
      title,
      price,
      description,
      category: categoryId,
      imagesUrl,
      stock,
      parentId,
    });
    console.log(parentId);
    // Добавляем продукт в магазин
    store.products.push(newProduct._id);
    await store.save();

    return res.status(201).json({
      message: "Товар успешно создан и добавлен в магазин",
      product: newProduct,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export const getAllShops = async (req, res) => {
  try {
    const stores = await shopModel
      .find({})
      .populate("products")
      .sort({ createdAt: -1 });
    res.status(200).json(stores);
    console.log(stores);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch stores", error: error.message });
  }
};

export const createShop = async (req, res) => {
  const { name, location, author, fileUrls } = req.body;
  console.log(req.body);

  try {
    const newStore = new shopModel({
      name,
      location,
      logo: fileUrls[0],
      author: author,
    });
    await newStore.save();
    res.status(201).json(newStore);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create store", error: error.message });
  }
};

export const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStore = await shopModel.findByIdAndDelete(id);

    if (!deletedStore) {
      return res.status(404).json({ message: "Магазин не найден" });
    }

    res
      .status(200)
      .json({ message: "Магазин удалён успешно", store: deletedStore });
  } catch (error) {
    res.status(500).json({ message: "Ошибка при удалении магазина", error });
  }
};

export const uploadFile = async (req, res) => {
  // if (!req.files) {
  //   return res.status(400).send("No files were uploaded.");
  // }

  console.log(req.files);
  upload(req, res, async function (err) {
    if (err) {
      console.log(err);
      return res.status(400).send({
        result: 0,
        message: err,
      });
    }

    // After successful upload, generate the URL
    const fileUrls = req.files
      ? Object.keys(req.files)
          .map((fieldname) => {
            return req.files[fieldname].map((file) => {
              const fileUrl = file.location; // This is the S3 URL of the uploaded file
              return fileUrl;
            });
          })
          .flat()
      : [];

    // console.log(fileUrls); // Log the URLs of the uploaded images

    return res.status(200).send({
      result: 1,
      message: "uploaded successfully",
      fileUrls: fileUrls, // Send back the file URLs in the response
    });
  });
};

export const addProductToShop = async (req, res) => {
  const { storeId } = req.params;
  const { productId } = req.body;

  try {
    const store = await shopModel.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    store.products.push(productId);
    await store.save();
    res.status(200).json(store);
  } catch (error) {
    res.status(500).json({
      message: "Failed to add product to store",
      error: error.message,
    });
  }
};

export const getProductsByStore = async (req, res) => {
  try {
    const { storeId } = req.params;

    // Validate storeId
    if (!storeId) {
      return res.status(400).json({ 
        success: false, 
        message: "Store ID is required" 
      });
    }

    // Find store
    const store = await shopModel.findById(storeId);
    if (!store) {
      return res.status(404).json({ 
        success: false, 
        message: "Store not found" 
      });
    }

    // Get all products from this store
    const products = await productModel.find({
      _id: { $in: store.products }
    }).populate("category");

    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch store products", 
      error: error.message 
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete the product
    const deletedProduct = await productModel.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }
    
    // Also remove reference from store
    await shopModel.updateMany(
      { products: id },
      { $pull: { products: id } }
    );
    
    res.status(200).json({ 
      success: true, 
      message: "Product deleted successfully",
      product: deletedProduct
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete product", 
      error: error.message 
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find and update the product
    const updatedProduct = await productModel.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Product updated successfully",
      product: updatedProduct
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update product", 
      error: error.message 
    });
  }
};

export const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find and update the store
    const updatedStore = await shopModel.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedStore) {
      return res.status(404).json({ 
        success: false, 
        message: "Store not found" 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Store updated successfully",
      store: updatedStore
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update store", 
      error: error.message 
    });
  }
};
