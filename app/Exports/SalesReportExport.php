<?php

namespace App\Exports;

use App\Models\Order;
use Carbon\Carbon;
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

class SalesReportExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle, ShouldAutoSize
{
    protected Carbon $startDate;
    protected Carbon $endDate;
    protected string $periodLabel;

    public function __construct(Carbon $startDate, Carbon $endDate, string $periodLabel = '')
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->periodLabel = $periodLabel;
    }

    public function collection()
    {
        return Order::with(['customer', 'items'])
            ->whereBetween('created_at', [$this->startDate, $this->endDate])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Order #',
            'Date',
            'Customer',
            'Items Count',
            'Subtotal (₱)',
            'Discount (₱)',
            'Tax (₱)',
            'Total (₱)',
            'Payment Method',
            'Payment Status',
            'Type',
        ];
    }

    public function map($order): array
    {
        return [
            $order->order_number ?? $order->id,
            Carbon::parse($order->created_at)->format('M d, Y h:i A'),
            $order->customer?->name ?? 'Walk-in',
            $order->items?->count() ?? 0,
            number_format((float) $order->subtotal, 2),
            number_format((float) $order->discount_amount, 2),
            number_format((float) $order->tax_amount, 2),
            number_format((float) $order->total, 2),
            ucfirst($order->payment_method ?? 'N/A'),
            ucfirst($order->payment_status ?? 'N/A'),
            ucfirst($order->type ?? 'sale'),
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = $sheet->getHighestRow();
        $lastCol = 'K';

        // Title row above headers
        $sheet->insertNewRowBefore(1, 2);
        $sheet->setCellValue('A1', 'SALES REPORT');
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
                    'startColor' => ['rgb' => '2b6cb0'],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'borders' => [
                    'allBorders' => ['borderStyle' => Border::BORDER_THIN],
                ],
            ],
            "A4:K{$lastRow}" => [
                'borders' => [
                    'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'e2e8f0']],
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'Sales Report';
    }
}
