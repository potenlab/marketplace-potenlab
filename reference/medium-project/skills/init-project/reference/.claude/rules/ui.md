---
paths:
  - "app/**/*.tsx"
  - "components/**/*.tsx"
  - "src/app/**/*.tsx"
  - "src/components/**/*.tsx"
---

# UI Quality Rules

> Auto-applied when working on UI files. Run `/baseline-ui` to review these rules.

## No AI Slop

- ❌ No gradients unless explicitly requested
- ❌ No purple/blue multicolor gradients
- ❌ No glow effects or neon colors
- ❌ No custom easing curves (use Tailwind defaults)
- ❌ No excessive shadows
- ✅ Use Tailwind default colors
- ✅ One accent color per view
- ✅ Clean, minimal aesthetic

## Animation

- ❌ No animation unless explicitly requested
- ❌ Never animate width/height/margin (causes layout shift)
- ❌ No entrance animations on every element
- ✅ Only transform + opacity (GPU accelerated)
- ✅ Max 200ms for micro-interactions
- ✅ Respect `prefers-reduced-motion`
- ✅ Use motion/react only when needed

```tsx
// Good - only when needed
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.2 }}
/>

// Bad - unnecessary animation
<motion.div
  initial={{ opacity: 0, y: 20, scale: 0.9 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
/>
```

## Typography

- ✅ `text-balance` for headings (prevents orphans)
- ✅ `text-pretty` for body text
- ✅ `tabular-nums` for numbers/data
- ✅ Consistent font sizes from Tailwind scale

```tsx
<h1 className="text-balance text-2xl font-semibold">Heading</h1>
<p className="text-pretty text-base text-muted-foreground">Body text</p>
<span className="tabular-nums">1,234.56</span>
```

## Layout

- ✅ Use `h-dvh` not `h-screen` (mobile viewport)
- ✅ Use semantic HTML (section, article, nav)
- ✅ Consistent spacing from Tailwind scale
- ✅ Mobile-first responsive design

## Components

- ✅ Use shadcn/ui (Radix-based) for all UI
- ✅ `aria-label` on icon-only buttons
- ✅ Proper focus states (keyboard navigation)
- ✅ Loading and error states for async

```tsx
// Good
<Button variant="ghost" size="icon" aria-label="Close menu">
  <X className="h-4 w-4" />
</Button>

// Bad - missing aria-label
<Button variant="ghost" size="icon">
  <X className="h-4 w-4" />
</Button>
```

## Forms

- ✅ Use react-hook-form + zod
- ✅ Show validation errors inline
- ✅ Disable submit while loading
- ✅ Show loading state on submit button

## Quick Checklist

Before completing UI task:
- [ ] No unnecessary gradients or effects
- [ ] No animations (unless requested)
- [ ] Uses shadcn/ui components
- [ ] Icon buttons have aria-label
- [ ] Responsive (test mobile)
- [ ] Loading/error states handled
