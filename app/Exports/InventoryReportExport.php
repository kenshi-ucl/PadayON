<?php

namespace App\Exports;

use App\Models\Product;
use App\Models\OrderItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class InventoryReportExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle, ShouldAutoSize
{
    protected Carbon $startDate;
    protected Carbon $endDate;

    public function __construct(Carbon $startDate, Carbon $endDate)
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function collection()
    {
        // Get sold quantities per product for the selected period
        $soldMap = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereBetween('orders.created_at', [$this->startDate, $this->endDate])
            ->select('order_items.product_id', DB::raw('SUM(order_items.quantity) as qty_sold'))
            ->groupBy('order_items.product_id')
            ->pluck('qty_sold', 'product_id');

        return Product::with('category')
            ->where('created_at', '<=', $this->endDate)
            ->orderBy('name')
            ->get()
            ->map(function ($product) use ($soldMap) {
                $product->period_qty_sold = $soldMap[$product->id] ?? 0;
                return $product;
            });
    }

    public function headings(): array
    {
        return [
            'Product Name',
            'SKU',
            'Category',
            'Cost Price (₱)',
            'Unit Price (₱)',
            'Current Stock',
            'Sold (Period)',
            'Stock Value (₱)',
            'Status',
        ];
    }

    public function map($product): array
    {
        $stockValue = (float) $product->cost_price * (int) $product->stock_quantity;
        $status = 'In Stock';
        if ($product->stock_quantity <= 0) {
            $status = 'Out of Stock';
        } elseif ($product->isLowStock()) {
            $status = 'Low Stock';
        }

        return [
            $product->name,
            $product->sku ?? 'N/A',
            $product->category?->name ?? 'Uncategorized',
            number_format((float) $product->cost_price, 2),
            number_format((float) $product->unit_price, 2),
            $product->stock_quantity,
            $product->period_qty_sold,
            number_format($stockValue, 2),
            $status,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = $sheet->getHighestRow();
        $lastCol = 'I';

        $sheet->insertNewRowBefore(1, 2);
        $sheet->setCellValue('A1', 'INVENTORY REPORT');
        $sheet->setCellValue('A2', 'Period: ' . $this->startDate->format('M d, Y') . ' - ' . $this->endDate->format('M d, Y'));
        $sheet->mergeCells("A1:{$lastCol}1");
        $sheet->mergeCells("A2:{$lastCol}2");

        return [
            1 => [
                'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => '1a365d']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
            2 => [
                'font' => ['italic' => true, 'size' => 11, 'color' => ['rgb' => '4a5568']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
            3 => [
                'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => 'ffffff']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '276749'],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'borders' => [
                    'allBorders' => ['borderStyle' => Border::BORDER_THIN],
                ],
            ],
            "A4:I{$lastRow}" => [
                'borders' => [
                    'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'e2e8f0']],
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'Inventory Report';
    }
}
