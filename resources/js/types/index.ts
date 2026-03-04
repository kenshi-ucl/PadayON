export interface User {
    id: number;
    tenant_id: string | null;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    is_admin: boolean;
    is_owner: boolean;
    is_active: boolean;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    business_type: string;
    plan: 'free' | 'starter' | 'pro' | 'business';
    email: string;
    phone: string | null;
    logo: string | null;
    business_name: string | null;
    business_address: string | null;
    city: string | null;
    province: string | null;
    region: string | null;
    gcash_enabled: boolean;
    maya_enabled: boolean;
    card_enabled: boolean;
    cod_enabled: boolean;
    is_active: boolean;
    trial_ends_at: string | null;
    subscription_ends_at: string | null;
    features: string[] | null;
    created_at: string;
}

export interface Customer {
    id: number;
    tenant_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    barangay: string | null;
    credit_limit: number;
    current_balance: number;
    credit_enabled: boolean;
    last_credit_date: string | null;
    last_payment_date: string | null;
    total_orders: number;
    total_spent: number;
    loyalty_points: number;
    is_active: boolean;
    is_suki: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: number;
    tenant_id: string;
    category_id: number | null;
    name: string;
    name_tl: string | null;
    sku: string | null;
    barcode: string | null;
    qr_token: string | null;
    description: string | null;
    cost_price: number;
    selling_price: number;
    wholesale_price: number | null;
    compare_price: number | null;
    is_taxable: boolean;
    stock_quantity: number;
    low_stock_threshold: number;
    stock_unit: string;
    track_inventory: boolean;
    allow_tingi: boolean;
    pieces_per_pack: number | null;
    tingi_price: number | null;
    image: string | null;
    is_active: boolean;
    is_featured: boolean;
    category?: Category;
    created_at: string;
}

export interface Category {
    id: number;
    tenant_id: string;
    parent_id: number | null;
    name: string;
    name_tl: string | null;
    slug: string;
    description: string | null;
    image: string | null;
    icon: string | null;
    color: string | null;
    type: 'product' | 'service' | 'menu';
    sort_order: number;
    is_active: boolean;
}

export interface Order {
    id: number;
    tenant_id: string;
    customer_id: number | null;
    user_id: number | null;
    order_number: string;
    type: 'pos' | 'online' | 'phone';
    status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled' | 'refunded';
    payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded';
    fulfillment_status: 'unfulfilled' | 'processing' | 'fulfilled' | 'delivered';
    subtotal: number;
    discount_amount: number;
    discount_type: string | null;
    tax_amount: number;
    delivery_fee: number;
    service_fee: number;
    total: number;
    amount_paid: number;
    change_amount: number;
    balance_due: number;
    is_credit: boolean;
    credit_due_date: string | null;
    payment_method: string | null;
    payment_reference: string | null;
    paid_at: string | null;
    is_delivery: boolean;
    delivery_address: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    notes: string | null;
    source: string;
    customer?: Customer;
    user?: User;
    items?: OrderItem[];
    payments?: Payment[];
    created_at: string;
    updated_at: string;
}

export interface OrderItem {
    id: number;
    tenant_id: string;
    order_id: number;
    product_id: number | null;
    name: string;
    sku: string | null;
    description: string | null;
    unit_price: number;
    cost_price: number;
    quantity: number;
    unit: string;
    discount_amount: number;
    tax_amount: number;
    total: number;
    notes: string | null;
    product?: Product;
}

export interface Payment {
    id: number;
    tenant_id: string;
    order_id: number | null;
    customer_id: number | null;
    payment_number: string;
    type: 'order' | 'credit_payment' | 'deposit' | 'refund';
    amount: number;
    fee: number;
    net_amount: number;
    currency: string;
    method: 'cash' | 'gcash' | 'maya' | 'card' | 'bank_transfer' | 'cod' | 'credit';
    channel: string | null;
    gateway: string | null;
    gateway_id: string | null;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    reference_number: string | null;
    paid_at: string | null;
    created_at: string;
}

export interface CreditTransaction {
    id: number;
    tenant_id: string;
    customer_id: number;
    order_id: number | null;
    payment_id: number | null;
    type: 'credit' | 'payment';
    amount: number;
    balance_before: number;
    balance_after: number;
    description: string | null;
    notes: string | null;
    order?: Order;
    payment?: Payment;
    created_at: string;
}

export interface DashboardStats {
    todayStats: {
        orders: number;
        revenue: number;
        customers: number;
    };
    weekStats: {
        orders: number;
        revenue: number;
    };
    monthStats: {
        orders: number;
        revenue: number;
        average_order: number;
    };
}

export interface PageProps {
    auth: {
        user: User;
        unreadNotificationCount: number;
    };
    tenant?: Tenant;
    flash?: {
        success?: string;
        error?: string;
    };
    errors?: Record<string, string>;
    [key: string]: unknown;
}

// Notification types
export type NotificationType = 'announcement' | 'alert' | 'task';
export type NotificationPriority = 'low' | 'normal' | 'high';

export interface AppNotification {
    id: string;
    type: string;
    title: string | null;
    notification_type: NotificationType;
    priority: NotificationPriority;
    data: {
        title: string;
        body: string;
        type: NotificationType;
        priority: NotificationPriority;
        sender_id: number | null;
        sender_name: string;
        source: 'admin' | 'owner';
        tenant_id?: string | null;
    };
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface TeamMember {
    id: number;
    name: string;
    email: string;
    is_owner: boolean;
    avatar: string | null;
}

export interface OwnerRecipient {
    id: number;
    name: string;
    email: string;
    tenant_name: string;
    plan: string;
}

// Cart types for POS
export interface CartItem {
    product: Product;
    quantity: number;
    unit_price: number;
    is_tingi: boolean;
    notes?: string;
}

export interface Cart {
    items: CartItem[];
    customer: Customer | null;
    subtotal: number;
    discount_amount: number;
    discount_type: 'percentage' | 'fixed' | null;
    discount_value: number;
    tax_amount: number;
    total: number;
    is_credit: boolean;
}
