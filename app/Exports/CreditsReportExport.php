<?php

namespace App\Exports;

use App\Models\Customer;
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

class CreditsReportExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle, ShouldAutoSize
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
        // Get credit transactions per customer for the period
        $periodCredits = DB::table('credit_transactions')
            ->whereBetween('created_at', [$this->startDate, $this->endDate])
            ->where('type', 'credit')
            ->select('customer_id', DB::raw('SUM(amount) as period_credit'))
            ->groupBy('customer_id')
            ->pluck('period_credit', 'customer_id');

        $periodPayments = DB::table('credit_transactions')
            ->whereBetween('created_at', [$this->startDate, $this->endDate])
            ->where('type', 'payment')
            ->select('customer_id', DB::raw('SUM(amount) as period_payment'))
            ->groupBy('customer_id')
            ->pluck('period_payment', 'customer_id');

        return Customer::where('current_balance', '>', 0)
            ->where('created_at', '<=', $this->endDate)
            ->orderByDesc('current_balance')
            ->get()
            ->map(function ($customer) use ($periodCredits, $periodPayments) {
                $customer->period_credit = $periodCredits[$customer->id] ?? 0;
                $customer->period_payment = $periodPayments[$customer->id] ?? 0;
                return $customer;
            });
    }

    public function headings(): array
    {
        return [
            'Customer Name',
            'Phone',
            'Outstanding Balance (₱)',
            'Credit Added (Period) (₱)',
            'Payments (Period) (₱)',
            'Credit Limit (₱)',
            'Last Credit Date',
            'Days Overdue',
            'Status',
        ];
    }

    public function map($customer): array
    {
        $lastCreditDate = $customer->last_credit_date ? Carbon::parse($customer->last_credit_date) : null;
        $daysOverdue = $lastCreditDate ? $lastCreditDate->diffInDays(now()) : 0;

        $status = 'Current';
        if ($daysOverdue > 30) {
            $status = 'Severely Overdue';
        } elseif ($daysOverdue > 14) {
            $status = 'Overdue';
        } elseif ($daysOverdue > 7) {
            $status = 'Due Soon';
        }

        return [
            $customer->name,
            $customer->phone ?? 'N/A',
            number_format((float) $customer->current_balance, 2),
            number_format((float) $customer->period_credit, 2),
            number_format((float) $customer->period_payment, 2),
            number_format((float) ($customer->credit_limit ?? 0), 2),
            $lastCreditDate ? $lastCreditDate->format('M d, Y') : 'N/A',
            $daysOverdue,
            $status,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = $sheet->getHighestRow();
        $lastCol = 'I';

        $sheet->insertNewRowBefore(1, 2);
        $sheet->setCellValue('A1', 'CREDITS (UTANG) REPORT');
        $sheet->setCellValue('A2', 'Period: ' . $this->startDate->format('M d, Y') . ' - ' . $this->endDate->format('M d, Y'));
        $sheet->mergeCells("A1:{$lastCol}1");
        $sheet->mergeCells("A2:{$lastCol}2");

        return [
            1 => [
                'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => '9b2c2c']],
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
                    'startColor' => ['rgb' => 'c53030'],
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
        return 'Credits Report';
    }
}
