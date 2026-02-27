<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice #{{ $order->order_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            color: #333;
            line-height: 1.5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
        }
        .invoice-title {
            text-align: right;
        }
        .invoice-title h1 {
            font-size: 28px;
            color: #3b82f6;
            margin-bottom: 5px;
        }
        .invoice-title p {
            color: #666;
        }
        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .info-block {
            width: 45%;
        }
        .info-block h3 {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .info-block p {
            margin-bottom: 3px;
        }
        .info-block .highlight {
            font-weight: bold;
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th {
            background-color: #f8fafc;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #e2e8f0;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            color: #64748b;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        .text-right {
            text-align: right;
        }
        .totals {
            float: right;
            width: 300px;
        }
        .totals table {
            margin-bottom: 0;
        }
        .totals td {
            border: none;
            padding: 8px 12px;
        }
        .totals .label {
            color: #666;
        }
        .totals .total-row {
            font-size: 16px;
            font-weight: bold;
            border-top: 2px solid #e2e8f0;
        }
        .totals .total-row td {
            padding-top: 15px;
        }
        .footer {
            clear: both;
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #666;
        }
        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-paid {
            background-color: #dcfce7;
            color: #166534;
        }
        .status-unpaid {
            background-color: #fef2f2;
            color: #991b1b;
        }
        .status-partial {
            background-color: #fef9c3;
            color: #854d0e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                {{ $tenant->business_name ?? $tenant->name }}
            </div>
            <div class="invoice-title">
                <h1>INVOICE</h1>
                <p>#{{ $order->order_number }}</p>
            </div>
        </div>

        <div class="info-section">
            <div class="info-block">
                <h3>Bill To</h3>
                <p class="highlight">{{ $order->customer?->name ?? $order->customer_name ?? 'Walk-in Customer' }}</p>
                @if($order->customer_phone || $order->customer?->phone)
                    <p>{{ $order->customer_phone ?? $order->customer?->phone }}</p>
                @endif
                @if($order->customer_email || $order->customer?->email)
                    <p>{{ $order->customer_email ?? $order->customer?->email }}</p>
                @endif
                @if($order->customer?->address)
                    <p>{{ $order->customer->address }}</p>
                @endif
            </div>
            <div class="info-block">
                <h3>Invoice Details</h3>
                <p><span class="highlight">Date:</span> {{ $order->created_at->format('F j, Y') }}</p>
                <p><span class="highlight">Type:</span> {{ ucfirst($order->type) }}</p>
                <p>
                    <span class="highlight">Status:</span>
                    <span class="status status-{{ $order->payment_status }}">{{ ucfirst($order->payment_status) }}</span>
                </p>
                @if($order->payment_method)
                    <p><span class="highlight">Payment:</span> {{ ucfirst($order->payment_method) }}</p>
                @endif
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 50%">Item</th>
                    <th class="text-right">Price</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($order->items as $item)
                    <tr>
                        <td>
                            {{ $item->name }}
                            @if($item->sku)
                                <br><small style="color: #666">SKU: {{ $item->sku }}</small>
                            @endif
                        </td>
                        <td class="text-right">₱{{ number_format($item->unit_price, 2) }}</td>
                        <td class="text-right">{{ $item->quantity }}</td>
                        <td class="text-right">₱{{ number_format($item->total, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals">
            <table>
                <tr>
                    <td class="label">Subtotal</td>
                    <td class="text-right">₱{{ number_format($order->subtotal, 2) }}</td>
                </tr>
                @if($order->discount_amount > 0)
                    <tr>
                        <td class="label">Discount</td>
                        <td class="text-right" style="color: #16a34a">-₱{{ number_format($order->discount_amount, 2) }}</td>
                    </tr>
                @endif
                @if($order->tax_amount > 0)
                    <tr>
                        <td class="label">VAT (12%)</td>
                        <td class="text-right">₱{{ number_format($order->tax_amount, 2) }}</td>
                    </tr>
                @endif
                @if($order->delivery_fee > 0)
                    <tr>
                        <td class="label">Delivery Fee</td>
                        <td class="text-right">₱{{ number_format($order->delivery_fee, 2) }}</td>
                    </tr>
                @endif
                <tr class="total-row">
                    <td class="label">Total</td>
                    <td class="text-right" style="color: #3b82f6">₱{{ number_format($order->total, 2) }}</td>
                </tr>
                @if($order->amount_paid > 0)
                    <tr>
                        <td class="label">Paid</td>
                        <td class="text-right">₱{{ number_format($order->amount_paid, 2) }}</td>
                    </tr>
                @endif
                @if($order->balance_due > 0)
                    <tr>
                        <td class="label"><strong>Balance Due</strong></td>
                        <td class="text-right" style="color: #dc2626"><strong>₱{{ number_format($order->balance_due, 2) }}</strong></td>
                    </tr>
                @endif
            </table>
        </div>

        <div class="footer">
            <p><strong>{{ $tenant->business_name ?? $tenant->name }}</strong></p>
            @if($tenant->business_address)
                <p>{{ $tenant->business_address }}, {{ $tenant->city }}, {{ $tenant->province }}</p>
            @endif
            @if($tenant->phone)
                <p>Tel: {{ $tenant->phone }}</p>
            @endif
            @if($tenant->email)
                <p>Email: {{ $tenant->email }}</p>
            @endif
            <p style="margin-top: 20px; font-size: 10px; color: #999">
                Generated by PadayON • {{ now()->format('F j, Y g:i A') }}
            </p>
        </div>
    </div>
</body>
</html>
