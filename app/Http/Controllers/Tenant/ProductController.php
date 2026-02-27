<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('category');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($category = $request->get('category')) {
            $query->where('category_id', $category);
        }

        if ($request->get('low_stock')) {
            $query->lowStock();
        }

        $products = $query->orderBy('name')->paginate(20);
        $categories = Category::where('type', 'product')->active()->orderBy('name')->get();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'low_stock']),
        ]);
    }

    public function create()
    {
        $categories = Category::where('type', 'product')->active()->orderBy('name')->get();

        return Inertia::render('Products/Create', [
            'categories' => $categories,
            'units' => ['piece', 'kg', 'liter', 'pack', 'bundle', 'box', 'dozen'],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'nullable|exists:categories,id',
            'name' => 'required|string|max:255',
            'name_tl' => 'nullable|string|max:255',
            'sku' => 'nullable|string|max:50',
            'barcode' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'low_stock_threshold' => 'required|integer|min:0',
            'stock_unit' => 'required|string|max:20',
            'track_inventory' => 'boolean',
            'allow_tingi' => 'boolean',
            'pieces_per_pack' => 'nullable|integer|min:1',
            'tingi_price' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,jfif,webp|max:51200',
        ]);

        // Handle image upload
        $imagePath = null;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $imagePath = $file->storeAs('products', $filename, 'public');
        }

        $product = Product::create([
            'tenant_id' => tenant()->id,
            ...$validated,
            'image' => $imagePath ? '/storage/' . $imagePath : null,
        ]);

        // Record initial stock
        if ($product->stock_quantity > 0) {
            $product->stockMovements()->create([
                'tenant_id' => tenant()->id,
                'user_id' => auth()->id(),
                'type' => 'adjustment',
                'quantity' => $product->stock_quantity,
                'stock_before' => 0,
                'stock_after' => $product->stock_quantity,
                'notes' => 'Initial stock',
            ]);
        }

        return redirect('/products')
            ->with('success', 'Product created successfully');
    }

    public function show(Product $product)
    {
        $product->load('category');

        $stockHistory = StockMovement::where('product_id', $product->id)
            ->with('user')
            ->latest()
            ->take(20)
            ->get();

        $stats = [
            'total_sold' => $product->orderItems()->sum('quantity'),
            'total_revenue' => $product->orderItems()->sum('total'),
            'average_daily_sales' => $product->orderItems()
                ->whereDate('created_at', '>=', now()->subDays(30))
                ->avg('quantity') ?? 0,
        ];

        return Inertia::render('Products/Show', [
            'product' => $product,
            'stockHistory' => $stockHistory,
            'stats' => $stats,
        ]);
    }

    public function edit(Product $product)
    {
        $categories = Category::where('type', 'product')->active()->orderBy('name')->get();

        return Inertia::render('Products/Edit', [
            'product' => $product,
            'categories' => $categories,
            'units' => ['piece', 'kg', 'liter', 'pack', 'bundle', 'box', 'dozen'],
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'category_id' => 'nullable|exists:categories,id',
            'name' => 'required|string|max:255',
            'name_tl' => 'nullable|string|max:255',
            'sku' => 'nullable|string|max:50',
            'barcode' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'low_stock_threshold' => 'required|integer|min:0',
            'stock_unit' => 'required|string|max:20',
            'track_inventory' => 'boolean',
            'allow_tingi' => 'boolean',
            'pieces_per_pack' => 'nullable|integer|min:1',
            'tingi_price' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:51200',
            'remove_image' => 'nullable|boolean',
        ]);

        // Handle image upload or removal
        if ($request->boolean('remove_image')) {
            // Delete old image
            if ($product->image) {
                $oldPath = str_replace('/storage/', '', $product->image);
                Storage::disk('public')->delete($oldPath);
            }
            $validated['image'] = null;
        } elseif ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image) {
                $oldPath = str_replace('/storage/', '', $product->image);
                Storage::disk('public')->delete($oldPath);
            }
            // Store new image
            $file = $request->file('image');
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $imagePath = $file->storeAs('products', $filename, 'public');
            $validated['image'] = '/storage/' . $imagePath;
        }

        // Remove remove_image from validated data
        unset($validated['remove_image']);

        $product->update($validated);

        return redirect('/products/' . $product->id)
            ->with('success', 'Product updated successfully');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect('/products')
            ->with('success', 'Product deleted successfully');
    }

    public function adjustStock(Request $request, Product $product)
    {
        $validated = $request->validate([
            'adjustment' => 'required|integer',
            'type' => 'required|in:purchase,adjustment,damage,return,transfer',
            'notes' => 'nullable|string|max:500',
        ]);

        $product->adjustStock(
            $validated['adjustment'],
            $validated['type'],
            auth()->id(),
            $validated['notes']
        );

        return back()->with('success', 'Stock adjusted successfully');
    }

    public function lowStock()
    {
        $products = Product::lowStock()
            ->with('category')
            ->orderBy('stock_quantity')
            ->paginate(20);

        return Inertia::render('Products/LowStock', [
            'products' => $products,
        ]);
    }

    public function categories()
    {
        $categories = Category::where('type', 'product')
            ->withCount('products')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Products/Categories', [
            'categories' => $categories,
        ]);
    }

    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_tl' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
        ]);

        Category::create([
            'tenant_id' => tenant()->id,
            'name' => $validated['name'],
            'name_tl' => $validated['name_tl'],
            'slug' => \Str::slug($validated['name']),
            'description' => $validated['description'],
            'icon' => $validated['icon'],
            'color' => $validated['color'],
            'type' => 'product',
            'is_active' => true,
        ]);

        return back()->with('success', 'Category created successfully');
    }
}
