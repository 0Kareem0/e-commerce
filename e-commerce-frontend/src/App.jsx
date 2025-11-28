// e-commerce-frontend/src/App.jsx
import React, { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  Star,
  Eye,
  Home,
  Package,
  User,
  Minus,
  Plus,
  Trash2,
  Edit,
  X,
} from "lucide-react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { useAuth } from "./context/AuthContext";

const API_BASE = "http://localhost:5000/api/products";
const ORDER_API = 'http://localhost:5000/api/orders';
export default function SkincareHomepage() {
  const { user, login, register, logout, loading: authLoading } = useAuth();

  const [currentPage, setCurrentPage] = useState("home");
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Simulated checkout form state
  const [shipName, setShipName] = useState("");
  const [shipAddress, setShipAddress] = useState("");
  const [shipCity, setShipCity] = useState("");
  const [shipCountry, setShipCountry] = useState("");
  const [shipPhone, setShipPhone] = useState("");
  const [shipNotes, setShipNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
    category: "",
    stock: "",
    bestseller: false,
    rating: 4.5,
  });

  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetch(API_BASE)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (currentPage === "orders" && user) {
      fetch(ORDER_API, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((r) => r.json())
        .then(setOrders)
        .catch(() => setOrders([]));
    }
  }, [currentPage, user]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing) {
        return prev.map((i) =>
          i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (_id, delta) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i._id === _id
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (_id) => {
    setCart((prev) => prev.filter((i) => i._id !== _id));
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock) || 0,
          rating: parseFloat(newProduct.rating) || 4.5,
        }),
      });
      if (res.ok) {
        const added = await res.json();
        setProducts((prev) => [...prev, added]);
        setNewProduct({
          name: "",
          price: "",
          description: "",
          image: "",
          category: "",
          stock: "",
          bestseller: false,
          rating: 4.5,
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add product");
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct({ ...product });
    setCurrentPage("edit-product");
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/${editingProduct._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(editingProduct),
      });
      if (res.ok) {
        const updated = await res.json();
        setProducts((prev) =>
          prev.map((p) => (p._id === updated._id ? updated : p))
        );
        setCurrentPage("products");
        setEditingProduct(null);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      alert("Please login to checkout.");
      setCurrentPage('login');
      return;
    }
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    try {
      const res = await fetch(`${ORDER_API}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          items: cart,
          total: cartTotal,
          shipping: {
            fullName: shipName || user?.name || "",
            address: shipAddress,
            city: shipCity,
            country: shipCountry,
            phone: shipPhone,
            notes: shipNotes,
          },
          paymentMethod,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Checkout failed");
      }

      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.message || "Checkout failed");
      }
      setCart([]);
      setCurrentPage('checkout-success');
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Checkout failed: " + err.message);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1
                className="text-2xl font-light text-gray-900 cursor-pointer"
                onClick={() => setCurrentPage("home")}
              >
                LUMINA
              </h1>
              <div className="hidden lg:flex items-center space-x-8">
                <button
                  onClick={() => setCurrentPage("home")}
                  className={`flex items-center space-x-2 ${
                    currentPage === "home"
                      ? "text-green-600"
                      : "text-gray-700 hover:text-gray-900"
                  } font-medium`}
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </button>
                <button
                  onClick={() => setCurrentPage("products")}
                  className={`flex items-center space-x-2 ${
                    currentPage === "products"
                      ? "text-green-600"
                      : "text-gray-700 hover:text-gray-900"
                  } font-medium`}
                >
                  <Package className="w-4 h-4" />
                  <span>Products</span>
                </button>
                {user?.isAdmin && (
                  <button
                    onClick={() => setCurrentPage("admin")}
                    className={`flex items-center space-x-2 ${
                      currentPage === "admin"
                        ? "text-green-600"
                        : "text-gray-700 hover:text-gray-900"
                    } font-medium`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Admin</span>
                  </button>
                )}
                {user && (
                  <button
                    onClick={() => setCurrentPage("orders")}
                    className={`flex items-center space-x-2 ${
                      currentPage === "orders"
                        ? "text-green-600"
                        : "text-gray-700 hover:text-gray-900"
                    } font-medium`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Orders</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 max-w-2xl mx-8 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search skincare products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-green-400 focus:ring-green-400 rounded-full"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="hidden md:flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-700" />
                  <span className="text-sm text-gray-900">Hi, {user.name}</span>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCurrentPage("login")}
                  className="hidden md:flex items-center space-x-2 text-gray-700 hover:text-gray-900 text-sm"
                >
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </button>
              )}
              <button
                onClick={() => setCurrentPage("cart")}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </Badge>
                )}
              </button>
            </div>
          </div>

          <div className="md:hidden pb-3 px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-full"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* HOME */}
      {currentPage === "home" && (
        <>
          <section className="relative h-96 md:h-screen max-h-96 bg-gradient-to-br from-green-50 via-beige-50 to-white overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white opacity-70"></div>
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
              <div className="text-center md:text-left max-w-2xl">
                <h2 className="text-4xl md:text-6xl font-light text-gray-900 mb-4">
                  Glow Naturally
                </h2>
                <p className="text-lg md:text-xl text-gray-600 mb-8">
                  Discover premium skincare crafted with clean, effective
                  ingredients
                </p>
                <Button
                  onClick={() => setCurrentPage("products")}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 rounded-full text-lg"
                >
                  Shop Collection
                </Button>
              </div>
            </div>
            <div className="absolute right-0 top-0 w-96 h-96 bg-green-100 rounded-full filter blur-3xl opacity-30 -mr-32 -mt-32"></div>
            <div className="absolute left-1/2 bottom-0 w-64 h-64 bg-beige-200 rounded-full filter blur-3xl opacity-40 transform -translate-x-1/2"></div>
          </section>

          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h3 className="text-3xl md:text-4xl font-light text-gray-900 mb-3">
                Skincare Essentials
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Curated collection of clean, effective products for every skin
                type
              </p>
            </div>
          </section>

          <section className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.slice(0, 4).map((p) => (
                  <Card
                    key={p._id}
                    className="group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border-0"
                  >
                    {p.bestseller && (
                      <Badge className="absolute top-3 left-3 bg-green-600 text-white z-10">
                        Bestseller
                      </Badge>
                    )}
                    <CardContent className="p-0">
                      <div className="aspect-square relative overflow-hidden bg-gray-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-beige-50"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 md:w-40 md:h-40" />
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white hover:bg-gray-100 rounded-full shadow-lg"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Quick View
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 md:p-6">
                        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                          {p.name}
                        </h4>
                        <div className="flex items-center mb-3">
                          {renderStars(p.rating || 4.5)}
                          <span className="ml-2 text-sm text-gray-600">
                            ({p.rating || 4.5})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-light text-gray-900">
                            ${p.price}
                          </span>
                          <Button
                            onClick={() => addToCart(p)}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center mt-8">
                <Button
                  onClick={() => setCurrentPage("products")}
                  variant="outline"
                  className="rounded-full px-8 py-6 border-green-600 text-green-600 hover:bg-green-50"
                >
                  View All Products
                </Button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* PRODUCTS PAGE */}
      {currentPage === "products" && (
        <section className="py-12 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h3 className="text-3xl md:text-4xl font-light text-gray-900 mb-3">
                All Products
              </h3>
              <p className="text-gray-600">
                {filteredProducts.length} product
                {filteredProducts.length !== 1 && "s"} found
              </p>
            </div>

            {user?.isAdmin && (
              <Card className="mb-12 p-6 max-w-2xl mx-auto">
                <h3 className="text-xl font-semibold mb-4">
                  Add New Product (Admin)
                </h3>
                <form
                  onSubmit={handleAddProduct}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={newProduct.description}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Image URL</Label>
                    <Input
                      value={newProduct.image}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, image: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, stock: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="bestseller"
                      checked={newProduct.bestseller}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          bestseller: e.target.checked,
                        })
                      }
                    />
                    <Label htmlFor="bestseller" className="cursor-pointer">
                      Bestseller
                    </Label>
                  </div>
                  <Button type="submit" className="md:col-span-2">
                    Add Product
                  </Button>
                </form>
              </Card>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((p) => (
                <Card
                  key={p._id}
                  className="group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border-0"
                >
                  {p.bestseller && (
                    <Badge className="absolute top-3 left-3 bg-green-600 text-white z-10">
                      Bestseller
                    </Badge>
                  )}

                  {user?.isAdmin && (
                    <div className="absolute top-3 right-3 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditClick(p)}
                        className="rounded-full p-2"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(p._id)}
                        className="rounded-full p-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  <CardContent className="p-0">
                    <div className="aspect-square relative overflow-hidden bg-gray-100">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-beige-50"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 md:w-40 md:h-40" />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white hover:bg-gray-100 rounded-full shadow-lg"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Quick View
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 md:p-6">
                      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {p.name}
                      </h4>
                      <div className="flex items-center mb-3">
                        {renderStars(p.rating || 4.5)}
                        <span className="ml-2 text-sm text-gray-600">
                          ({p.rating || 4.5})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-light text-gray-900">
                          ${p.price}
                        </span>
                        <Button
                          onClick={() => addToCart(p)}
                          className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">
                  No products found matching "{searchQuery}"
                </p>
                <Button
                  onClick={() => setSearchQuery("")}
                  variant="outline"
                  className="rounded-full"
                >
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* EDIT PRODUCT PAGE */}
      {currentPage === "edit-product" && editingProduct && (
        <section className="py-12 bg-gray-50 min-h-screen">
          <div className="max-w-2xl mx-auto px-4">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6">Edit Product</h3>
              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={editingProduct.description || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Image URL</Label>
                  <Input
                    value={editingProduct.image || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        image: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingProduct(null);
                      setCurrentPage("products");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </section>
      )}

      {/* ADMIN DASHBOARD */}
      {currentPage === "admin" && user?.isAdmin && (
        <section className="py-12 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-light mb-8">Admin Dashboard</h2>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Total Products
                  </h3>
                  <p className="text-3xl font-bold text-green-600">
                    {products.length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Total in Cart
                  </h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {cartCount}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Revenue (Demo)
                  </h3>
                  <p className="text-3xl font-bold text-purple-600">
                    ${cartTotal.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => setCurrentPage("products")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Manage Products
                  </Button>
                  <Button variant="outline">View Orders</Button>
                  <Button variant="outline">User Analytics</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* CART PAGE */}
      {currentPage === "cart" && (
        <section className="py-12 bg-gray-50 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-light text-gray-900 mb-8">
              Shopping Cart
            </h2>

            {cart.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Your cart is empty
                </h3>
                <p className="text-gray-600 mb-6">
                  Add some products to get started
                </p>
                <Button
                  onClick={() => setCurrentPage("products")}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8"
                >
                  Shop Now
                </Button>
              </Card>
            ) : (
              <>
                <div className="space-y-4 mb-8">
                  {cart.map((item) => (
                    <Card key={item._id} className="p-4 md:p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-50 to-beige-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="bg-gray-200 border-2 border-dashed rounded-lg w-16 h-16" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {item.name}
                          </h4>
                          <p className="text-lg text-gray-900">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Button
                            onClick={() => updateQuantity(item._id, -1)}
                            variant="outline"
                            size="sm"
                            className="rounded-full w-8 h-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="text-gray-900 font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            onClick={() => updateQuantity(item._id, 1)}
                            variant="outline"
                            size="sm"
                            className="rounded-full w-8 h-8 p-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => removeFromCart(item._id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card className="p-6 bg-white">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-xl font-medium text-gray-900">
                      <span>Total</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShipName(user?.name || "");
                      setCurrentPage("checkout");
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full py-6 text-lg"
                  >
                    Proceed to Checkout
                  </Button>
                </Card>
              </>
            )}
          </div>
        </section>
      )}

      {/* CHECKOUT FORM (SIMULATED PAYMENT) */}
      {currentPage === "checkout" && (
        <section className="py-12 bg-gray-50 min-h-screen">
          <div className="max-w-3xl mx-auto px-4">
            <Card className="p-6">
              <h2 className="text-2xl font-light mb-6">Checkout</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Shipping Details</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Full Name</Label>
                      <Input value={shipName} onChange={e=>setShipName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Input value={shipAddress} onChange={e=>setShipAddress(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>City</Label>
                        <Input value={shipCity} onChange={e=>setShipCity(e.target.value)} />
                      </div>
                      <div>
                        <Label>Country</Label>
                        <Input value={shipCountry} onChange={e=>setShipCountry(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={shipPhone} onChange={e=>setShipPhone(e.target.value)} />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Input value={shipNotes} onChange={e=>setShipNotes(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3">Payment</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input id="pm-cod" type="radio" name="pm" checked={paymentMethod==='cod'} onChange={()=>setPaymentMethod('cod')} />
                      <Label htmlFor="pm-cod">Cash on Delivery (Simulated)</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input id="pm-card" type="radio" name="pm" checked={paymentMethod==='card'} onChange={()=>setPaymentMethod('card')} />
                      <Label htmlFor="pm-card">Card (Simulated)</Label>
                    </div>
                    <div className="text-sm text-gray-500">No real payment is processed.</div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex justify-between"><span>Items</span><span>{cart.length}</span></div>
                    <div className="flex justify-between font-medium"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Button className="flex-1" onClick={handleCheckout}>Place Order</Button>
                    <Button variant="outline" className="flex-1" onClick={()=>setCurrentPage('cart')}>Back to Cart</Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* CHECKOUT SUCCESS */}
      {currentPage === "checkout-success" && (
        <section className="py-12 bg-gray-50 min-h-screen">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-12 h-12 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-light mb-2">Payment Successful!</h2>
              <p className="text-gray-600">
                Thank you for your purchase. Your order is being processed.
              </p>
            </div>
            <Button
              onClick={() => setCurrentPage("orders")}
              className="bg-green-600 hover:bg-green-700"
            >
              View Orders
            </Button>
          </div>
        </section>
      )}

      {/* ORDERS PAGE */}
      {currentPage === "orders" && (
        <section className="py-12 bg-gray-50 min-h-screen">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-light mb-8">Your Orders</h2>
            {orders.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No orders yet</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <Card key={order._id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-medium">
                          Order #{order._id.slice(-6)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        className={
                          order.status === "pending"
                            ? "bg-yellow-500"
                            : "bg-green-600"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div
                          key={item._id}
                          className="flex items-center space-x-4"
                        >
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t mt-4 pt-4 flex justify-between font-medium">
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

{/* LOGIN / REGISTER PAGE */}
{currentPage === 'login' && (
  <section className="py-12 bg-gray-50 min-h-screen flex items-center justify-center">
    <Card className="max-w-md w-full mx-4 p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-light text-gray-900 mb-2">Welcome</h2>
        <p className="text-gray-600">Sign in or create an account</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="admin@example.com" />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button 
            onClick={async () => {
              const res = await login(loginEmail, loginPassword);
              if (res.token) {
                setLoginEmail('');
                setLoginPassword('');
                setCurrentPage('home');
              } else {
                alert(res.message || 'Login failed');
              }
            }} 
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full py-3"
          >
            Sign In
          </Button>
        </div>

        <div className="border-t pt-6 space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={regName} onChange={e => setRegName(e.target.value)} placeholder="John Doe" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button 
            onClick={async () => {
              const res = await register(regName, regEmail, regPassword);
              if (res.token) {
                setRegName('');
                setRegEmail('');
                setRegPassword('');
                setCurrentPage('home');
              } else {
                alert(res.message || 'Registration failed');
              }
            }} 
            variant="outline" 
            className="w-full rounded-full py-3"
          >
            Create Account
          </Button>
        </div>
      </div>
    </Card>
  </section>
)}

      {/* MOBILE BOTTOM NAV */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-4 gap-1 p-2">
          <button
            onClick={() => setCurrentPage("home")}
            className={`flex flex-col items-center py-2 ${
              currentPage === "home" ? "text-green-600" : "text-gray-600"
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => setCurrentPage("products")}
            className={`flex flex-col items-center py-2 ${
              currentPage === "products" ? "text-green-600" : "text-gray-600"
            }`}
          >
            <Package className="w-6 h-6" />
            <span className="text-xs mt-1">Products</span>
          </button>
          {user ? (
            user.isAdmin ? (
              <button
                onClick={() => setCurrentPage("admin")}
                className={`flex flex-col items-center py-2 ${
                  currentPage === "admin" ? "text-green-600" : "text-gray-600"
                }`}
              >
                <Package className="w-6 h-6" />
                <span className="text-xs mt-1">Admin</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentPage("orders")}
                className={`flex flex-col items-center py-2 ${
                  currentPage === "orders" ? "text-green-600" : "text-gray-600"
                }`}
              >
                <Package className="w-6 h-6" />
                <span className="text-xs mt-1">Orders</span>
              </button>
            )
          ) : (
            <button
              onClick={() => setCurrentPage("login")}
              className={`flex flex-col items-center py-2 ${
                currentPage === "login" ? "text-green-600" : "text-gray-600"
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs mt-1">Login</span>
            </button>
          )}
          <button
            onClick={() => setCurrentPage("cart")}
            className={`flex flex-col items-center py-2 relative ${
              currentPage === "cart" ? "text-green-600" : "text-gray-600"
            }`}
          >
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <Badge className="absolute top-1 right-1/4 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {cartCount}
              </Badge>
            )}
            <span className="text-xs mt-1">Cart</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
