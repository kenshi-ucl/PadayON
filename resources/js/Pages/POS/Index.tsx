import React, { useState, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';
import { Head, router } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps, Product, Category, Customer, CartItem } from '@/types';
import {
    MagnifyingGlassIcon,
    PlusIcon,
    MinusIcon,
    TrashIcon,
    ShoppingCartIcon,
    UserIcon,
    XMarkIcon,
    PrinterIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface POSProps extends PageProps {
    categories: Category[];
    products: Product[];
    customers: Customer[];
    settings: {
        currency: string;
        tax_rate: number;
    };
}

export default function POS({ categories, products, customers, settings }: POSProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<string>('cash');
    const [amountPaid, setAmountPaid] = useState<string>('');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | null>(null);
    const [discountValue, setDiscountValue] = useState<string>('');
    const [orderNotes, setOrderNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastOrder, setLastOrder] = useState<any>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showQuickCustomerForm, setShowQuickCustomerForm] = useState(false);
    const [quickCustomerName, setQuickCustomerName] = useState('');
    const [quickCustomerPhone, setQuickCustomerPhone] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Local stock tracking: maps product ID -> displayed stock quantity
    // This reflects real-time stock changes as items are added/removed from cart
    // Database stock only changes permanently when "Charge" completes the order
    const [localStockMap, setLocalStockMap] = useState<Record<number, number>>(() => {
        const map: Record<number, number> = {};
        products.forEach((p) => {
            if (p.track_inventory) {
                map[p.id] = p.stock_quantity;
            }
        });
        return map;
    });

    // Re-sync localStockMap when products prop changes (after router.reload)
    useEffect(() => {
        const map: Record<number, number> = {};
        products.forEach((p) => {
            if (p.track_inventory) {
                map[p.id] = p.stock_quantity;
            }
        });
        setLocalStockMap(map);
    }, [products]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    // Filter products
    const filteredProducts = useMemo(() => {
        let filtered = products;

        if (selectedCategory !== null) {
            filtered = filtered.filter((p) => p.category_id === selectedCategory);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.name.toLowerCase().includes(query) ||
                    p.sku?.toLowerCase().includes(query) ||
                    p.barcode?.includes(query)
            );
        }

        return filtered;
    }, [products, selectedCategory, searchQuery]);

    // Filter customers
    const filteredCustomers = useMemo(() => {
        if (!customerSearch.trim()) return customers;
        const query = customerSearch.toLowerCase();
        return customers.filter(
            (c) =>
                c.name.toLowerCase().includes(query) ||
                c.phone?.toLowerCase().includes(query)
        );
    }, [customers, customerSearch]);

    // Cart calculations
    const subtotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    }, [cart]);

    const discountAmount = useMemo(() => {
        if (!discountType || !discountValue) return 0;
        const val = parseFloat(discountValue);
        if (isNaN(val)) return 0;
        if (discountType === 'percentage') return subtotal * (val / 100);
        return val;
    }, [subtotal, discountType, discountValue]);

    const total = useMemo(() => {
        return Math.max(0, subtotal - discountAmount);
    }, [subtotal, discountAmount]);

    const changeAmount = useMemo(() => {
        const paid = parseFloat(amountPaid);
        if (isNaN(paid)) return 0;
        return Math.max(0, paid - total);
    }, [amountPaid, total]);

    // Cart actions
    const addToCart = (product: Product) => {
        // Block adding if tracked product has no available stock
        if (product.track_inventory && (localStockMap[product.id] ?? 0) <= 0) {
            return;
        }

        setCart((prev) => {
            const existingIndex = prev.findIndex(
                (item) => item.product.id === product.id && !item.is_tingi
            );

            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: updated[existingIndex].quantity + 1,
                };
                return updated;
            }

            return [
                ...prev,
                {
                    product,
                    quantity: 1,
                    unit_price: product.selling_price,
                    is_tingi: false,
                },
            ];
        });

        // Decrement local displayed stock
        if (product.track_inventory) {
            setLocalStockMap((prev) => ({
                ...prev,
                [product.id]: (prev[product.id] ?? 0) - 1,
            }));
        }
    };

    const addTingiToCart = (product: Product) => {
        if (!product.allow_tingi || !product.tingi_price) return;

        // Block adding if tracked product has no available stock
        if (product.track_inventory && (localStockMap[product.id] ?? 0) <= 0) {
            return;
        }

        setCart((prev) => {
            const existingIndex = prev.findIndex(
                (item) => item.product.id === product.id && item.is_tingi
            );

            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: updated[existingIndex].quantity + 1,
                };
                return updated;
            }

            return [
                ...prev,
                {
                    product,
                    quantity: 1,
                    unit_price: product.tingi_price!,
                    is_tingi: true,
                },
            ];
        });

        // Decrement local displayed stock
        if (product.track_inventory) {
            setLocalStockMap((prev) => ({
                ...prev,
                [product.id]: (prev[product.id] ?? 0) - 1,
            }));
        }
    };

    const updateQuantity = (index: number, delta: number) => {
        // When incrementing (+1), block if tracked product has no stock left
        if (delta > 0) {
            const item = cart[index];
            if (item && item.product.track_inventory && (localStockMap[item.product.id] ?? 0) <= 0) {
                return;
            }
        }

        const item = cart[index];
        if (!item) return;

        const newQty = item.quantity + delta;

        setCart((prev) => {
            const updated = [...prev];
            if (newQty <= 0) {
                return updated.filter((_, i) => i !== index);
            }
            updated[index] = { ...updated[index], quantity: newQty };
            return updated;
        });

        // Update local stock: delta -1 means restore 1 stock, delta +1 means consume 1 stock
        if (item.product.track_inventory) {
            if (newQty <= 0) {
                // Item fully removed: restore remaining quantity (which is the current quantity)
                setLocalStockMap((prev) => ({
                    ...prev,
                    [item.product.id]: (prev[item.product.id] ?? 0) + item.quantity,
                }));
            } else {
                // Adjust by the opposite of delta: -delta restores stock, +delta consumes stock
                setLocalStockMap((prev) => ({
                    ...prev,
                    [item.product.id]: (prev[item.product.id] ?? 0) - delta,
                }));
            }
        }
    };

    const removeFromCart = (index: number) => {
        const item = cart[index];
        if (item && item.product.track_inventory) {
            // Restore full quantity of the removed item back to displayed stock
            setLocalStockMap((prev) => ({
                ...prev,
                [item.product.id]: (prev[item.product.id] ?? 0) + item.quantity,
            }));
        }
        setCart((prev) => prev.filter((_, i) => i !== index));
    };

    const clearCart = () => {
        // Restore all cart items' quantities back to displayed stock
        setLocalStockMap((prev) => {
            const restored = { ...prev };
            cart.forEach((item) => {
                if (item.product.track_inventory) {
                    restored[item.product.id] = (restored[item.product.id] ?? 0) + item.quantity;
                }
            });
            return restored;
        });
        setCart([]);
        setSelectedCustomer(null);
        setDiscountType(null);
        setDiscountValue('');
        setOrderNotes('');
        setPaymentMethod('cash');
        setAmountPaid('');
    };

    // Quick customer creation
    const createQuickCustomer = async () => {
        if (!quickCustomerName.trim()) return;

        try {
            const response = await axios.post('/pos/quick-customer', {
                name: quickCustomerName,
                phone: quickCustomerPhone || null,
            });

            const data = response.data;
            if (data.success) {
                setSelectedCustomer(data.customer);
                setShowQuickCustomerForm(false);
                setQuickCustomerName('');
                setQuickCustomerPhone('');
                setShowCustomerModal(false);
            }
        } catch (error) {
            console.error('Failed to create customer:', error);
        }
    };

    // Process order
    const processOrder = async () => {
        if (cart.length === 0) return;
        setIsProcessing(true);

        try {
            const orderData = {
                customer_id: selectedCustomer?.id ?? null,
                items: cart.map((item) => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    is_tingi: item.is_tingi,
                })),
                discount_type: discountType,
                discount_value: discountValue ? parseFloat(discountValue) : null,
                payment_method: paymentMethod,
                amount_paid: amountPaid ? parseFloat(amountPaid) : total,
                notes: orderNotes || null,
                is_credit: paymentMethod === 'credit',
            };

            const response = await axios.post('/pos/orders', orderData);

            const data = response.data;

            if (data.success) {
                setLastOrder(data);
                setShowPaymentModal(false);
                setShowReceiptModal(true);
                // Reset cart state without restoring stock (stock is now permanently decremented in DB)
                setCart([]);
                setSelectedCustomer(null);
                setDiscountType(null);
                setDiscountValue('');
                setOrderNotes('');
                setPaymentMethod('cash');
                setAmountPaid('');
                // Reload page data from server to get fresh stock values from database
                router.reload({ only: ['products'] });
                // Re-initialize localStockMap will happen via the useEffect below
            } else {
                alert(data.message || 'Failed to create order');
            }
        } catch (error: any) {
            console.error('Order processing error:', error);
            const message = error?.response?.data?.message || 'Failed to process order. Please try again.';
            alert(message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <TenantLayout title="POS">
            <Head title="Point of Sale" />

            <div className="flex gap-4 h-[calc(100vh-9rem)]">
                {/* Left: Products */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Search & Categories */}
                    <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                        <div className="relative mb-3">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search products by name, SKU or barcode..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-1">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={clsx(
                                    'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                                    selectedCategory === null
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                )}
                            >
                                All
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={clsx(
                                        'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                                        selectedCategory === cat.id
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    )}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                                <ShoppingCartIcon className="h-12 w-12 mb-2" />
                                <p>No products found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                                {filteredProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className={clsx(
                                            'bg-white rounded-xl shadow-sm overflow-hidden transition-shadow',
                                            product.track_inventory && (localStockMap[product.id] ?? product.stock_quantity) <= 0
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'hover:shadow-md cursor-pointer group'
                                        )}
                                        onClick={() => addToCart(product)}
                                    >
                                        {product.image ? (
                                            <div className="aspect-square bg-gray-100 overflow-hidden">
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-square bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                                                <CubeIconFallback />
                                            </div>
                                        )}
                                        <div className="p-3">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {product.name}
                                            </p>
                                            <p className="text-sm font-bold text-primary-600 mt-1">
                                                {formatCurrency(product.selling_price)}
                                            </p>
                                            <div className="flex items-center justify-between mt-1">
                                                {product.track_inventory && (
                                                    <span
                                                        className={clsx(
                                                            'text-xs',
                                                            (localStockMap[product.id] ?? product.stock_quantity) <= 0
                                                                ? 'text-red-600 font-bold'
                                                                : (localStockMap[product.id] ?? product.stock_quantity) <= product.low_stock_threshold
                                                                    ? 'text-red-500 font-medium'
                                                                    : 'text-gray-500'
                                                        )}
                                                    >
                                                        Stock: {localStockMap[product.id] ?? product.stock_quantity}
                                                    </span>
                                                )}
                                                {product.allow_tingi && product.tingi_price && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addTingiToCart(product);
                                                        }}
                                                        className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full hover:bg-yellow-200"
                                                    >
                                                        Tingi {formatCurrency(product.tingi_price)}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Cart */}
                <div className="w-96 flex-shrink-0 bg-white rounded-xl shadow-sm flex flex-col">
                    {/* Cart Header */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <ShoppingCartIcon className="h-5 w-5" />
                                Cart ({cart.length})
                            </h2>
                            {cart.length > 0 && (
                                <button
                                    onClick={clearCart}
                                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Customer selection */}
                        <div className="mt-3">
                            {selectedCustomer ? (
                                <div className="flex items-center justify-between bg-primary-50 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 text-primary-600" />
                                        <div>
                                            <p className="text-sm font-medium text-primary-700">
                                                {selectedCustomer.name}
                                            </p>
                                            {selectedCustomer.credit_enabled && (
                                                <p className="text-xs text-primary-600">
                                                    Credit: {formatCurrency(selectedCustomer.current_balance)} / {formatCurrency(selectedCustomer.credit_limit)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedCustomer(null)}
                                        className="text-primary-400 hover:text-primary-600"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowCustomerModal(true)}
                                    className="w-full flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
                                >
                                    <UserIcon className="h-4 w-4" />
                                    Select customer (optional)
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <ShoppingCartIcon className="h-16 w-16 mb-3" />
                                <p className="text-sm">Cart is empty</p>
                                <p className="text-xs mt-1">Click products to add them</p>
                            </div>
                        ) : (
                            cart.map((item, index) => (
                                <div
                                    key={`${item.product.id}-${item.is_tingi}`}
                                    className="flex gap-3 bg-gray-50 rounded-lg p-3"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {item.product.name}
                                            {item.is_tingi && (
                                                <span className="ml-1 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                                                    Tingi
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {formatCurrency(item.unit_price)} × {item.quantity}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(item.unit_price * item.quantity)}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => updateQuantity(index, -1)}
                                                className="p-1 rounded bg-white border border-gray-300 hover:bg-gray-50"
                                            >
                                                <MinusIcon className="h-3 w-3" />
                                            </button>
                                            <span className="text-sm font-medium w-8 text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(index, 1)}
                                                className="p-1 rounded bg-white border border-gray-300 hover:bg-gray-50"
                                            >
                                                <PlusIcon className="h-3 w-3" />
                                            </button>
                                            <button
                                                onClick={() => removeFromCart(index)}
                                                className="p-1 rounded text-red-500 hover:bg-red-50 ml-1"
                                            >
                                                <TrashIcon className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Cart Footer */}
                    {cart.length > 0 && (
                        <div className="border-t border-gray-200 p-4 space-y-3">
                            {/* Discount */}
                            <div className="flex gap-2">
                                <select
                                    value={discountType || ''}
                                    onChange={(e) =>
                                        setDiscountType(
                                            e.target.value
                                                ? (e.target.value as 'percentage' | 'fixed')
                                                : null
                                        )
                                    }
                                    className="text-sm border border-gray-300 rounded-lg px-2 py-1.5"
                                >
                                    <option value="">No discount</option>
                                    <option value="percentage">% Off</option>
                                    <option value="fixed">₱ Off</option>
                                </select>
                                {discountType && (
                                    <input
                                        type="number"
                                        min="0"
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                        placeholder={discountType === 'percentage' ? '0%' : '₱0'}
                                        className="flex-1 text-sm border border-gray-300 rounded-lg px-2 py-1.5"
                                    />
                                )}
                            </div>

                            {/* Totals */}
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold text-gray-900 pt-1 border-t">
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>

                            {/* Pay Button */}
                            <button
                                onClick={() => {
                                    setAmountPaid(total.toFixed(2));
                                    setShowPaymentModal(true);
                                }}
                                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <ShoppingCartIcon className="h-5 w-5" />
                                Charge {formatCurrency(total)}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Customer Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Select Customer</h3>
                            <button onClick={() => setShowCustomerModal(false)}>
                                <XMarkIcon className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-4">
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
                            />

                            <button
                                onClick={() => setShowQuickCustomerForm(!showQuickCustomerForm)}
                                className="w-full text-sm text-primary-600 font-medium mb-3 flex items-center gap-1 hover:text-primary-700"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Add new customer
                            </button>

                            {showQuickCustomerForm && (
                                <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Customer name"
                                        value={quickCustomerName}
                                        onChange={(e) => setQuickCustomerName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Phone (optional)"
                                        value={quickCustomerPhone}
                                        onChange={(e) => setQuickCustomerPhone(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    />
                                    <button
                                        onClick={createQuickCustomer}
                                        className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
                                    >
                                        Add Customer
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 pb-4">
                            {filteredCustomers.map((customer) => (
                                <button
                                    key={customer.id}
                                    onClick={() => {
                                        setSelectedCustomer(customer);
                                        setShowCustomerModal(false);
                                    }}
                                    className="w-full text-left px-3 py-3 rounded-lg hover:bg-gray-50 flex items-center justify-between group"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{customer.name}</p>
                                        <p className="text-sm text-gray-500">{customer.phone || 'No phone'}</p>
                                    </div>
                                    {customer.credit_enabled && (
                                        <span className="text-xs text-gray-500">
                                            Credit: {formatCurrency(customer.current_balance)}
                                        </span>
                                    )}
                                </button>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No customers found
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Payment</h3>
                            <button onClick={() => setShowPaymentModal(false)}>
                                <XMarkIcon className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="text-center bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-500">Total Amount</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {formatCurrency(total)}
                                </p>
                            </div>

                            {/* Payment methods */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">
                                    Payment Method
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'cash', label: '💵 Cash' },
                                        { value: 'gcash', label: '💙 GCash' },
                                        { value: 'maya', label: '💚 Maya' },
                                        { value: 'card', label: '💳 Card' },
                                        ...(selectedCustomer?.credit_enabled
                                            ? [{ value: 'credit', label: '📝 Credit' }]
                                            : []),
                                    ].map((method) => (
                                        <button
                                            key={method.value}
                                            onClick={() => setPaymentMethod(method.value)}
                                            className={clsx(
                                                'py-2 px-3 rounded-lg text-sm font-medium border-2 transition-colors',
                                                paymentMethod === method.value
                                                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            )}
                                        >
                                            {method.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Credit warning */}
                            {paymentMethod === 'credit' && selectedCustomer && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-medium text-yellow-800">Credit Purchase</p>
                                        <p className="text-yellow-700">
                                            Available: {formatCurrency(selectedCustomer.credit_limit - selectedCustomer.current_balance)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Amount paid (for cash) */}
                            {paymentMethod === 'cash' && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">
                                        Amount Received
                                    </label>
                                    <input
                                        type="number"
                                        value={amountPaid}
                                        onChange={(e) => setAmountPaid(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg font-semibold"
                                        min="0"
                                        step="0.01"
                                    />
                                    {changeAmount > 0 && (
                                        <p className="text-sm mt-1 text-green-600 font-medium">
                                            Change: {formatCurrency(changeAmount)}
                                        </p>
                                    )}

                                    {/* Quick amount buttons */}
                                    <div className="grid grid-cols-4 gap-2 mt-2">
                                        {[
                                            Math.ceil(total),
                                            Math.ceil(total / 50) * 50,
                                            Math.ceil(total / 100) * 100,
                                            Math.ceil(total / 500) * 500,
                                        ]
                                            .filter((v, i, arr) => arr.indexOf(v) === i)
                                            .slice(0, 4)
                                            .map((amount) => (
                                                <button
                                                    key={amount}
                                                    onClick={() => setAmountPaid(amount.toString())}
                                                    className="text-sm py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                                                >
                                                    ₱{amount}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={orderNotes}
                                    onChange={(e) => setOrderNotes(e.target.value)}
                                    rows={2}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    placeholder="Add order notes..."
                                />
                            </div>

                            <button
                                onClick={processOrder}
                                disabled={isProcessing || (paymentMethod === 'cash' && parseFloat(amountPaid) < total)}
                                className={clsx(
                                    'w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-colors',
                                    isProcessing
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700'
                                )}
                            >
                                {isProcessing ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="h-5 w-5" />
                                        Complete Order
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal — full thermal receipt after order completion */}
            {showReceiptModal && lastOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:bg-white print:absolute">
                    <div className="bg-white rounded-xl w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto print:rounded-none print:shadow-none print:max-w-none print:m-0 print:overflow-visible">
                        {/* Print-only styles */}
                        <style>{`
                            @media print {
                                body * { visibility: hidden !important; }
                                .pos-receipt-content, .pos-receipt-content * { visibility: visible !important; }
                                .pos-receipt-content {
                                    position: absolute !important;
                                    left: 0 !important;
                                    top: 0 !important;
                                    width: 80mm !important;
                                    padding: 10px !important;
                                    font-family: 'Courier New', monospace !important;
                                }
                                .pos-no-print { display: none !important; }
                            }
                        `}</style>

                        <div className="pos-receipt-content p-6 font-mono text-sm">
                            {/* Store Header */}
                            <div className="text-center mb-4">
                                <h1 className="text-lg font-bold italic">
                                    {lastOrder.tenant?.name || 'PadayON Store'}
                                </h1>
                                {lastOrder.tenant?.address && (
                                    <p className="text-xs">{lastOrder.tenant.address}</p>
                                )}
                                {(lastOrder.tenant?.city || lastOrder.tenant?.province) && (
                                    <p className="text-xs">
                                        {[lastOrder.tenant.city, lastOrder.tenant.province].filter(Boolean).join(', ')}
                                    </p>
                                )}
                                {lastOrder.tenant?.phone && (
                                    <p className="text-xs">Phone: {lastOrder.tenant.phone}</p>
                                )}
                                {lastOrder.tenant?.email && (
                                    <p className="text-xs">Email: {lastOrder.tenant.email}</p>
                                )}
                            </div>

                            {/* Separator */}
                            <div className="border-t border-dashed border-gray-400 my-3"></div>

                            {/* Receipt Details */}
                            <div className="space-y-1 text-xs">
                                <p>Receipt ID: {lastOrder.order?.order_number}</p>
                                <p>Date: {lastOrder.order?.created_at
                                    ? new Date(lastOrder.order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                                <p>Time: {lastOrder.order?.created_at
                                    ? new Date(lastOrder.order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                    : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </p>
                                <p>Order Type: {lastOrder.order?.is_credit ? 'Credit Sale (Utang)' : 'Cash Sale'}</p>
                            </div>

                            {/* Separator */}
                            <div className="border-t border-dashed border-gray-400 my-3"></div>

                            {/* Items */}
                            <div className="space-y-2">
                                {lastOrder.order?.items?.map((item: any, idx: number) => (
                                    <div key={item.id ?? idx} className="flex justify-between text-xs">
                                        <span>
                                            {item.name} {Number(item.quantity) > 1
                                                ? `x${Number(item.quantity).toFixed(3).replace(/\.?0+$/, '')}`
                                                : ''}
                                        </span>
                                        <span>₱{Number(item.total).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Separator */}
                            <div className="border-t border-dashed border-gray-400 my-3"></div>

                            {/* Totals */}
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>₱{Number(lastOrder.order?.subtotal ?? 0).toFixed(2)}</span>
                                </div>
                                {Number(lastOrder.order?.discount_amount) > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Discount:</span>
                                        <span>-₱{Number(lastOrder.order.discount_amount).toFixed(2)}</span>
                                    </div>
                                )}
                                {Number(lastOrder.order?.tax_amount) > 0 && (
                                    <div className="flex justify-between">
                                        <span>Tax:</span>
                                        <span>₱{Number(lastOrder.order.tax_amount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold">
                                    <span>Total:</span>
                                    <span>₱{Number(lastOrder.order?.total ?? 0).toFixed(2)}</span>
                                </div>
                                <p className="mt-2">
                                    Payment Method: {lastOrder.order?.payment_method
                                        ? lastOrder.order.payment_method.charAt(0).toUpperCase() + lastOrder.order.payment_method.slice(1)
                                        : 'N/A'}
                                </p>
                                {Number(lastOrder.order?.amount_paid) > 0 && (
                                    <p>Amount Paid: ₱{Number(lastOrder.order.amount_paid).toFixed(2)}</p>
                                )}
                                {Number(lastOrder.order?.change_amount) > 0 && (
                                    <p className="text-green-600 font-medium">
                                        Change: ₱{Number(lastOrder.order.change_amount).toFixed(2)}
                                    </p>
                                )}
                                <p>Category: Sales Revenue</p>
                                {lastOrder.order?.customer && (
                                    <p>Customer: {lastOrder.order.customer.name}</p>
                                )}
                            </div>

                            {/* Separator */}
                            <div className="border-t border-dashed border-gray-400 my-3"></div>

                            {/* Footer */}
                            <div className="text-center text-xs mt-4">
                                <p>Thank you for your business!</p>
                                <p className="mt-1">This is an official receipt for your records.</p>
                            </div>
                        </div>

                        {/* Action Buttons — hidden when printing */}
                        <div className="pos-no-print flex gap-3 p-4 border-t">
                            <button
                                onClick={() => setShowReceiptModal(false)}
                                className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <PrinterIcon className="h-4 w-4" />
                                Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}

function CubeIconFallback() {
    return (
        <svg
            className="h-10 w-10 text-primary-300"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
            />
        </svg>
    );
}
