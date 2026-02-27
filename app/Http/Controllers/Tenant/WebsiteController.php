<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Website;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class WebsiteController extends Controller
{
    public function index()
    {
        $website = Website::firstOrCreate(
            ['tenant_id' => tenant()->id],
            [
                'template' => 'default',
                'is_published' => false,
                'primary_color' => '#3B82F6',
                'secondary_color' => '#10B981',
            ]
        );

        $pages = Page::where('tenant_id', tenant()->id)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Website/Index', [
            'website' => $website,
            'pages' => $pages,
            'templates' => config('padayon.website.templates'),
            'subdomain' => tenant()->slug . config('padayon.website.subdomain_suffix'),
        ]);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'template' => 'nullable|string|max:50',
            'logo' => 'nullable|image|max:2048',
            'favicon' => 'nullable|image|max:512',
            'primary_color' => 'nullable|string|max:20',
            'secondary_color' => 'nullable|string|max:20',
            'accent_color' => 'nullable|string|max:20',
            'tagline' => 'nullable|string|max:255',
            'about' => 'nullable|string',
            'social_links' => 'nullable|array',
            'business_hours' => 'nullable|array',
            'meta_title' => 'nullable|string|max:70',
            'meta_description' => 'nullable|string|max:160',
            'google_analytics_id' => 'nullable|string|max:50',
            'facebook_pixel_id' => 'nullable|string|max:50',
            'custom_css' => 'nullable|string',
            'custom_js' => 'nullable|string',
        ]);

        $website = Website::where('tenant_id', tenant()->id)->first();

        // Handle logo upload
        if ($request->hasFile('logo')) {
            if ($website->logo) {
                Storage::disk('public')->delete($website->logo);
            }
            $validated['logo'] = $request->file('logo')->store('websites/logos', 'public');
        }

        // Handle favicon upload
        if ($request->hasFile('favicon')) {
            if ($website->favicon) {
                Storage::disk('public')->delete($website->favicon);
            }
            $validated['favicon'] = $request->file('favicon')->store('websites/favicons', 'public');
        }

        $website->update($validated);

        return back()->with('success', 'Website settings updated');
    }

    public function pages()
    {
        $pages = Page::where('tenant_id', tenant()->id)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Website/Pages', [
            'pages' => $pages,
        ]);
    }

    public function createPage()
    {
        return Inertia::render('Website/PageEditor', [
            'page' => null,
        ]);
    }

    public function storePage(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:100|alpha_dash',
            'content' => 'nullable|string',
            'gjs_data' => 'nullable|string',
            'html' => 'nullable|string',
            'css' => 'nullable|string',
            'meta_title' => 'nullable|string|max:70',
            'meta_description' => 'nullable|string|max:160',
            'is_published' => 'boolean',
            'show_in_nav' => 'boolean',
        ]);

        // Check for duplicate slug
        $exists = Page::where('tenant_id', tenant()->id)
            ->where('slug', $validated['slug'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['slug' => 'This URL slug is already in use']);
        }

        $page = Page::create([
            'tenant_id' => tenant()->id,
            ...$validated,
            'published_at' => $validated['is_published'] ? now() : null,
        ]);

        return redirect('/website')
            ->with('success', 'Page created successfully');
    }

    public function editPage(Page $page)
    {
        return Inertia::render('Website/PageEditor', [
            'page' => $page,
        ]);
    }

    public function updatePage(Request $request, Page $page)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:100|alpha_dash',
            'content' => 'nullable|string',
            'gjs_data' => 'nullable|string',
            'html' => 'nullable|string',
            'css' => 'nullable|string',
            'meta_title' => 'nullable|string|max:70',
            'meta_description' => 'nullable|string|max:160',
            'is_published' => 'boolean',
            'show_in_nav' => 'boolean',
            'is_homepage' => 'boolean',
        ]);

        // Check for duplicate slug (excluding current page)
        $exists = Page::where('tenant_id', tenant()->id)
            ->where('slug', $validated['slug'])
            ->where('id', '!=', $page->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['slug' => 'This URL slug is already in use']);
        }

        // If setting as homepage, unset other homepages
        if ($validated['is_homepage'] ?? false) {
            Page::where('tenant_id', tenant()->id)
                ->where('id', '!=', $page->id)
                ->update(['is_homepage' => false]);
        }

        $page->update([
            ...$validated,
            'published_at' => $validated['is_published'] && !$page->published_at ? now() : $page->published_at,
        ]);

        return back()->with('success', 'Page updated successfully');
    }

    public function deletePage(Page $page)
    {
        if ($page->is_homepage) {
            return back()->withErrors(['error' => 'Cannot delete the homepage']);
        }

        $page->delete();

        return redirect('/website')
            ->with('success', 'Page deleted successfully');
    }

    public function publish()
    {
        $website = Website::where('tenant_id', tenant()->id)->first();
        $website->update(['is_published' => true]);

        return back()->with('success', 'Website published! Your site is now live.');
    }

    public function unpublish()
    {
        $website = Website::where('tenant_id', tenant()->id)->first();
        $website->update(['is_published' => false]);

        return back()->with('success', 'Website unpublished');
    }
}
