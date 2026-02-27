<?php

namespace App\Exports;

use App\Models\Customer;
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

class CustomersReportExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle, ShouldAutoSize
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
        return Customer::where('created_at', '<=', $this->endDate)
            ->withCount([
                'orders' => function ($query) {
                    $query->whereBetween('created_at', [$this->startDate, $this->endDate]);
                }
            ])
            ->withSum([
                'orders' => function ($query) {
                    $query->whereBetween('created_at', [$this->startDate, $this->endDate]);
                }
            ], 'total')
            ->orderByDesc('orders_sum_total')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Customer Name',
            'Phone',
            'Email',
            'Orders (Period)',
            'Total Spent (₱)',
            'Credit Balance (₱)',
            'Suki',
            'Customer Since',
        ];
    }

    public function map($customer): array
    {
        return [
            $customer->name,
            $customer->phone ?? 'N/A',
            $customer->email ?? 'N/A',
            $customer->orders_count ?? 0,
            number_format((float) ($customer->orders_sum_total ?? 0), 2),
            number_format((float) $customer->current_balance, 2),
            $customer->is_suki ? 'Yes' : 'No',
            $customer->created_at ? Carbon::parse($customer->created_at)->format('M d, Y') : 'N/A',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = $sheet->getHighestRow();
        $lastCol = 'H';

        $sheet->insertNewRowBefore(1, 2);
        $sheet->setCellValue('A1', 'CUSTOMERS REPORT');
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
                    'startColor' => ['rgb' => '6b46c1'],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'borders' => [
                    'allBorders' => ['borderStyle' => Border::BORDER_THIN],
                ],
            ],
            "A4:H{$lastRow}" => [
                'borders' => [
                    'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'e2e8f0']],
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'Customers Report';
    }
}
