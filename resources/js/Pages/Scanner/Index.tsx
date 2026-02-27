import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps, Product, Customer } from '@/types';
import {
    MinusIcon,
    PlusIcon,
    TrashIcon,
    ShoppingCartIcon,
    XMarkIcon,
    CameraIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    QrCodeIcon,
    PhotoIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';
import jsQR from 'jsqr';

interface ScannerProps extends PageProps {
    customers: Customer[];
    settings: {
        currency: string;
        tax_rate: number;
    };
}

interface ScannerCartItem {
    product: Product;
    quantity: number;
    unit_price: number;
}

export default function Scanner({ customers, settings }: ScannerProps) {
    const [cart, setCart] = useState<ScannerCartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
    const [scannedQty, setScannedQty] = useState(1);
    const [isCharging, setIsCharging] = useState(false);
    const [showChargeModal, setShowChargeModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [lastScannedToken, setLastScannedToken] = useState<string | null>(null);
    const [orderSuccess, setOrderSuccess] = useState<any>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [lookingUp, setLookingUp] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isSecureContext = typeof window !== 'undefined' && (
        window.isSecureContext ||
        window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
    );

    const hasCameraApi = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

    const formatCurrency = (amount: number | string) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(num)) return '₱0.00';
        return '₱' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Start camera for QR scanning
    const startCamera = useCallback(async () => {
        try {
            setCameraError(null);
            setCameraReady(false);

            if (!hasCameraApi) {
                setCameraError(null); // Don't show error, we have fallback
                setScanning(true); // Show the fallback UI
                return;
            }

            // Try environment camera first, fall back to any camera
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } },
                });
            } catch {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
            }

            streamRef.current = stream;
            setScanning(true); // This renders the video element
        } catch (err: any) {
            console.error('Camera error:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setCameraError('Camera permission denied. Please allow camera access in your browser settings and reload.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setCameraError('No camera found on this device.');
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setCameraError('Camera is already in use by another app.');
            } else {
                setCameraError(`Camera error: ${err.message || 'Unknown error'}`);
            }
            setScanning(true); // Still show fallback
        }
    }, [hasCameraApi]);

    // Attach stream to video element AFTER it renders
    useEffect(() => {
        if (scanning && streamRef.current && videoRef.current && !cameraReady) {
            const video = videoRef.current;
            video.srcObject = streamRef.current;
            video.onloadedmetadata = () => {
                video.play().then(() => {
                    setCameraReady(true);
                }).catch(() => {
                    setCameraReady(true); // Continue anyway
                });
            };
            // Fallback timeout
            const timeout = setTimeout(() => {
                video.play().catch(() => { });
                setCameraReady(true);
            }, 1500);
            return () => clearTimeout(timeout);
        }
    }, [scanning, cameraReady]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = 0;
        }
        setScanning(false);
        setCameraReady(false);
    }, []);

    // QR code scanning loop — only runs when camera is ready
    const scanFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || !cameraReady) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code && code.data && code.data !== lastScannedToken) {
                setLastScannedToken(code.data);
                handleQrScanned(code.data);
                return;
            }
        }

        animationRef.current = requestAnimationFrame(scanFrame);
    }, [cameraReady, lastScannedToken]);

    useEffect(() => {
        if (cameraReady) {
            animationRef.current = requestAnimationFrame(scanFrame);
        }
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [cameraReady, scanFrame]);

    // Cleanup on unmount
    useEffect(() => {
        return () => { stopCamera(); };
    }, [stopCamera]);

    // Handle photo capture fallback (for HTTP / no camera API)
    const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const img = new Image();
            const url = URL.createObjectURL(file);

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = url;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth',
            });

            if (code && code.data) {
                handleQrScanned(code.data);
            } else {
                toast.error('No QR code found in the image. Please try again.');
            }
        } catch {
            toast.error('Failed to process image.');
        }

        // Reset input so user can select same file again
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Handle a scanned QR code
    const handleQrScanned = async (qrData: string) => {
        if (lookingUp) return;
        setLookingUp(true);
        try {
            const response = await axios.post('/scanner/lookup', { qr_token: qrData });
            if (response.data.success) {
                const raw = response.data.product;
                // Cast numeric fields that PHP may return as strings
                const product: Product = {
                    ...raw,
                    selling_price: Number(raw.selling_price) || 0,
                    cost_price: Number(raw.cost_price) || 0,
                    wholesale_price: raw.wholesale_price ? Number(raw.wholesale_price) : null,
                    compare_price: raw.compare_price ? Number(raw.compare_price) : null,
                    tingi_price: raw.tingi_price ? Number(raw.tingi_price) : null,
                    stock_quantity: Number(raw.stock_quantity) || 0,
                };
                setScannedProduct(product);
                setScannedQty(1);
                toast.success(`Scanned: ${product.name}`);
                addScannedToCart(product, 1);
            }
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to scan QR code';
            toast.error(message);
            setTimeout(() => setLastScannedToken(null), 2000);
        } finally {
            setLookingUp(false);
        }
    };

    const addScannedToCart = (product: Product, qty: number) => {
        setCart(prev => {
            const existing = prev.findIndex(item => item.product.id === product.id);
            if (existing >= 0) {
                const updated = [...prev];
                updated[existing].quantity += qty;
                return updated;
            }
            return [...prev, { product, quantity: qty, unit_price: product.selling_price }];
        });
    };

    // Update scanned product qty AND sync to cart in real-time
    const updateScannedQty = (delta: number) => {
        const newQty = Math.max(1, scannedQty + delta);
        setScannedQty(newQty);

        // Sync cart with the new quantity
        if (scannedProduct) {
            setCart(prev => {
                const existing = prev.findIndex(item => item.product.id === scannedProduct.id);
                if (existing >= 0) {
                    const updated = [...prev];
                    updated[existing] = { ...updated[existing], quantity: newQty };
                    return updated;
                }
                return prev;
            });
        }
    };

    const updateCartQty = (index: number, delta: number) => {
        setCart(prev => {
            const updated = [...prev];
            const newQty = updated[index].quantity + delta;
            if (newQty <= 0) { updated.splice(index, 1); }
            else { updated[index].quantity = newQty; }
            return updated;
        });
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    // Buy More: cart is already synced, just clear scanned display and allow next scan
    const handleBuyMore = () => {
        setScannedProduct(null);
        setScannedQty(1);
        setLastScannedToken(null);
        toast.success('Product saved to cart! Scan another item.');
    };

    const handleCharge = async () => {
        if (cart.length === 0) { toast.error('Cart is empty'); return; }

        setIsCharging(true);
        try {
            const response = await axios.post('/scanner/charge', {
                items: cart.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                })),
                payment_method: paymentMethod,
                amount_paid: amountPaid ? parseFloat(amountPaid) : undefined,
            });

            if (response.data.success) {
                setOrderSuccess(response.data);
                setCart([]);
                setScannedProduct(null);
                setScannedQty(1);
                setLastScannedToken(null);
                setShowChargeModal(false);
                setCartOpen(false);
                toast.success('Order charged successfully!');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to charge');
        } finally {
            setIsCharging(false);
        }
    };

    const handleNewScan = () => {
        setOrderSuccess(null);
        setLastScannedToken(null);
    };

    return (
        <TenantLayout title="Scanner">
            <Head title="Scanner" />

            {/* Top Bar with Cart */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <QrCodeIcon className="h-7 w-7 text-primary-600" />
                        QR Scanner
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Scan product QR codes to add items</p>
                </div>
                <button
                    onClick={() => setCartOpen(true)}
                    className="relative flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg"
                >
                    <ShoppingCartIcon className="h-5 w-5" />
                    <span className="font-medium">Cart</span>
                    {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                            {cartCount}
                        </span>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scanner Area */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <CameraIcon className="h-5 w-5 text-primary-600" />
                            Camera Scanner
                        </h2>
                    </div>
                    <div className="p-4">
                        {!scanning ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center">
                                    <QrCodeIcon className="h-12 w-12 text-primary-600" />
                                </div>
                                <p className="text-gray-500 text-center max-w-xs">
                                    Start the camera to scan product QR codes
                                </p>
                                <button
                                    onClick={startCamera}
                                    className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium shadow-lg flex items-center gap-2"
                                >
                                    <CameraIcon className="h-5 w-5" />
                                    Start Scanning
                                </button>

                                {/* Photo fallback always available */}
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 mb-2">Or scan from a photo:</p>
                                    <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                                        <PhotoIcon className="h-4 w-4" />
                                        Upload QR Photo
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handlePhotoCapture}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Live camera view — only shown when camera API is available */}
                                {streamRef.current && (
                                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                                        <video
                                            ref={videoRef}
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            playsInline
                                            muted
                                        />
                                        {/* Scanning overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-48 h-48 border-2 border-primary-400 rounded-2xl relative">
                                                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-500 rounded-tl-lg" />
                                                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-500 rounded-tr-lg" />
                                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-500 rounded-bl-lg" />
                                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-500 rounded-br-lg" />
                                                <div className="absolute left-2 right-2 h-0.5 bg-primary-500 animate-scan-line" />
                                            </div>
                                        </div>
                                        {lookingUp && (
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                <div className="bg-white rounded-xl px-4 py-2 text-sm font-medium">
                                                    Looking up product...
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Photo capture fallback — always shown when camera API unavailable, also as secondary option */}
                                {!streamRef.current && (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-4 bg-gray-50 rounded-xl">
                                        <ExclamationTriangleIcon className="h-10 w-10 text-amber-500" />
                                        <p className="text-sm text-gray-600 text-center max-w-xs">
                                            Live camera not available over HTTP.
                                            <br />Use the photo capture below instead:
                                        </p>
                                    </div>
                                )}

                                {/* Photo fallback button — always available during scanning */}
                                <label className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors font-medium border border-blue-200">
                                    <PhotoIcon className="h-5 w-5" />
                                    {streamRef.current ? 'Or Scan from Photo' : 'Take Photo of QR Code'}
                                    <input
                                        ref={!streamRef.current ? fileInputRef : undefined}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handlePhotoCapture}
                                        className="hidden"
                                    />
                                </label>

                                {cameraError && (
                                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-4 py-2 rounded-lg text-sm">
                                        <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                                        <span>{cameraError}</span>
                                    </div>
                                )}

                                <button
                                    onClick={stopCamera}
                                    className="w-full py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                >
                                    Stop Scanner
                                </button>
                            </div>
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                </div>

                {/* Scanned Product / Order Success */}
                <div className="space-y-4">
                    {orderSuccess ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-6">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircleIcon className="h-10 w-10 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-green-700">Order Charged!</h3>
                                <p className="text-gray-600">
                                    Order #{orderSuccess.order?.order_number} has been recorded.
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(orderSuccess.order?.total || 0)}
                                </p>
                                <button
                                    onClick={handleNewScan}
                                    className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
                                >
                                    Scan New Items
                                </button>
                            </div>
                        </div>
                    ) : scannedProduct ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-primary-200 overflow-hidden">
                            <div className="p-4 border-b bg-primary-50">
                                <h2 className="text-lg font-semibold text-primary-900">Scanned Product</h2>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="flex items-start gap-4">
                                    {scannedProduct.image ? (
                                        <img
                                            src={scannedProduct.image}
                                            alt={scannedProduct.name}
                                            className="w-20 h-20 object-cover rounded-xl border"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center border">
                                            <QrCodeIcon className="h-8 w-8 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-gray-900 truncate">
                                            {scannedProduct.name}
                                        </h3>
                                        <p className="text-primary-600 font-semibold text-xl">
                                            {formatCurrency(scannedProduct.selling_price)}
                                        </p>
                                        {scannedProduct.track_inventory && (
                                            <p className="text-sm text-gray-500">
                                                Stock: {scannedProduct.stock_quantity} {scannedProduct.stock_unit}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-6 py-4 bg-gray-50 rounded-xl">
                                    <button
                                        onClick={() => updateScannedQty(-1)}
                                        className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                                    >
                                        <MinusIcon className="h-6 w-6" />
                                    </button>
                                    <span className="text-3xl font-bold text-gray-900 w-16 text-center">
                                        {scannedQty}
                                    </span>
                                    <button
                                        onClick={() => updateScannedQty(1)}
                                        className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
                                    >
                                        <PlusIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-xl">
                                    <span className="text-gray-600 font-medium">Subtotal:</span>
                                    <span className="text-xl font-bold text-gray-900">
                                        {formatCurrency(scannedProduct.selling_price * scannedQty)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleBuyMore}
                                        className="py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCartIcon className="h-5 w-5" />
                                        Buy More
                                    </button>
                                    <button
                                        onClick={() => setShowChargeModal(true)}
                                        className="py-3 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                                    >
                                        <CheckCircleIcon className="h-5 w-5" />
                                        Charge
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                    <QrCodeIcon className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-700">No Product Scanned</h3>
                                <p className="text-gray-500 text-sm max-w-xs">
                                    Point your camera at a product's QR code to begin
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Quick Cart Summary */}
                    {cart.length > 0 && !orderSuccess && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Cart ({cartCount} items)
                                </h2>
                                <span className="text-lg font-bold text-primary-600">
                                    {formatCurrency(cartTotal)}
                                </span>
                            </div>
                            <div className="divide-y max-h-48 overflow-y-auto">
                                {cart.map((item, idx) => (
                                    <div key={item.product.id} className="px-4 py-3 flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {item.product.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatCurrency(item.unit_price)} × {item.quantity}
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatCurrency(item.unit_price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t">
                                <button
                                    onClick={() => setShowChargeModal(true)}
                                    className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
                                >
                                    Charge {formatCurrency(cartTotal)}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Drawer */}
            <div className={clsx(
                'fixed inset-0 z-50 transition-all',
                cartOpen ? 'visible' : 'invisible'
            )}>
                <div
                    className={clsx(
                        'fixed inset-0 bg-black/50 transition-opacity',
                        cartOpen ? 'opacity-100' : 'opacity-0'
                    )}
                    onClick={() => setCartOpen(false)}
                />
                <div className={clsx(
                    'fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl transform transition-transform flex flex-col',
                    cartOpen ? 'translate-x-0' : 'translate-x-full'
                )}>
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <ShoppingCartIcon className="h-5 w-5 text-primary-600" />
                            Cart ({cartCount} items)
                        </h2>
                        <button
                            onClick={() => setCartOpen(false)}
                            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                                <ShoppingCartIcon className="h-12 w-12 text-gray-300" />
                                <p className="text-gray-500">Your cart is empty</p>
                                <p className="text-sm text-gray-400">Scan QR codes to add products</p>
                            </div>
                        ) : (
                            cart.map((item, idx) => (
                                <div key={item.product.id} className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        {item.product.image ? (
                                            <img
                                                src={item.product.image}
                                                alt={item.product.name}
                                                className="w-14 h-14 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center">
                                                <QrCodeIcon className="h-6 w-6 text-gray-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{item.product.name}</p>
                                            <p className="text-sm text-primary-600 font-medium">
                                                {formatCurrency(item.unit_price)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(idx)}
                                            className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => updateCartQty(idx, -1)}
                                                className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                            >
                                                <MinusIcon className="h-4 w-4" />
                                            </button>
                                            <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateCartQty(idx, 1)}
                                                className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                            >
                                                <PlusIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <span className="font-bold text-gray-900">
                                            {formatCurrency(item.unit_price * item.quantity)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div className="border-t p-4 space-y-3">
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-medium text-gray-700">Total:</span>
                                <span className="font-bold text-gray-900">{formatCurrency(cartTotal)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        setCartOpen(false);
                                        setLastScannedToken(null);
                                        setScannedProduct(null);
                                    }}
                                    className="py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <QrCodeIcon className="h-5 w-5" />
                                    Scan More
                                </button>
                                <button
                                    onClick={() => {
                                        setCartOpen(false);
                                        setShowChargeModal(true);
                                    }}
                                    className="py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCircleIcon className="h-5 w-5" />
                                    Charge
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Charge Modal */}
            {showChargeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setShowChargeModal(false)} />
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Charge Order</h2>
                            <button
                                onClick={() => setShowChargeModal(false)}
                                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                {cart.map(item => (
                                    <div key={item.product.id} className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                            {item.product.name} × {item.quantity}
                                        </span>
                                        <span className="font-medium">
                                            {formatCurrency(item.unit_price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>{formatCurrency(cartTotal)}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['cash', 'gcash', 'maya'].map(method => (
                                        <button
                                            key={method}
                                            onClick={() => setPaymentMethod(method)}
                                            className={clsx(
                                                'py-2 px-3 rounded-lg text-sm font-medium border transition-colors',
                                                paymentMethod === method
                                                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                            )}
                                        >
                                            {method.charAt(0).toUpperCase() + method.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {paymentMethod === 'cash' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount Paid
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                                        <input
                                            type="number"
                                            value={amountPaid}
                                            onChange={e => setAmountPaid(e.target.value)}
                                            placeholder={cartTotal.toFixed(2)}
                                            min="0"
                                            step="0.01"
                                            className="w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    {amountPaid && parseFloat(amountPaid) > cartTotal && (
                                        <p className="text-sm text-green-600 mt-1">
                                            Change: {formatCurrency(parseFloat(amountPaid) - cartTotal)}
                                        </p>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleCharge}
                                disabled={isCharging || cart.length === 0}
                                className="w-full py-3.5 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                            >
                                {isCharging ? 'Processing...' : `Charge ${formatCurrency(cartTotal)}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes scanLine {
                    0%, 100% { top: 10%; }
                    50% { top: 85%; }
                }
                .animate-scan-line {
                    animation: scanLine 2s ease-in-out infinite;
                    position: absolute;
                }
            `}</style>
        </TenantLayout>
    );
}
