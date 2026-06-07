# AcademiQ Design System Cheatsheet

Palette: `#0F2854` · `#1C4D8D` · `#4988C4` · `#BDE8F5`

---

### Tailwind v4 → paste into `src/index.css`

```css
@import "tailwindcss";

@theme {
  /* Brand */
  --color-navy:        #0F2854;
  --color-navy-mid:    #1C4D8D;
  --color-blue:        #4988C4;
  --color-sky:         #BDE8F5;
  --color-sky-pale:    #F0FAFD;

  /* Surfaces */
  --color-surface:     #F8FAFC;
  --color-card:        #FFFFFF;
  --color-muted:       #F1F5F9;
  --color-border:      #E2E8F0;

  /* Semantic */
  --color-success:     #166534;
  --color-success-bg:  #DCFCE7;
  --color-warning:     #B45309;
  --color-warning-bg:  #FEF3C7;
  --color-danger:      #B91C1C;
  --color-danger-bg:   #FEE2E2;

  /* Shadows */
  --shadow-card:   0 1px 3px 0 rgb(15 40 84 / 0.08);
  --shadow-modal:  0 20px 60px -10px rgb(15 40 84 / 0.25);
  --shadow-input:  0 0 0 3px rgb(73 136 196 / 0.20);
}
```

---

## Color Cheatsheet

| What | Class (v3) | Hex |
|------|-----------|-----|
| Sidebar bg | `bg-navy` | `#0F2854` |
| Active nav, primary button | `bg-navy-mid` | `#1C4D8D` |
| Links, accent fills | `bg-blue` | `#4988C4` |
| Card/chip backgrounds | `bg-sky` | `#BDE8F5` |
| Page background | `bg-surface` | `#F8FAFC` |
| Card background | `bg-surface-card` | `#FFFFFF` |
| Table alt rows, input bg | `bg-surface-muted` | `#F1F5F9` |
| All borders | `border-surface-border` | `#E2E8F0` |

> **v4 users:** replace `bg-navy` → `bg-[--color-navy]` or just use the hex directly with `bg-navy`. Tailwind v4 also lets you use `bg-(--color-navy)` with the new shorthand.

---

## Components

### Sidebar
```jsx
<aside className="bg-navy w-64 min-h-screen text-white">
  {/* Active link */}
  <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                bg-navy-mid text-white font-medium text-sm">
    Dashboard
  </a>
  {/* Inactive link */}
  <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-sky hover:bg-navy-mid hover:text-white
                transition-colors text-sm">
    Students
  </a>
</aside>
```

### Topbar
```jsx
<header className="h-14 bg-white border-b border-border
                   flex items-center justify-between px-6">
  <h1 className="text-base font-semibold text-navy">Dashboard</h1>
  <div className="w-8 h-8 rounded-full bg-navy-mid text-white
                  flex items-center justify-center text-xs font-medium">
    MA
  </div>
</header>
```

### Page background
```jsx
<main className="min-h-screen bg-surface p-6">
```

### Card
```jsx
<div className="bg-white border border-border rounded-lg shadow-card p-5">
```

### KPI Card
```jsx
<div className="bg-white border border-border rounded-lg p-5">
  <p className="text-xs text-blue uppercase tracking-wider font-medium">
    Active Students
  </p>
  <p className="text-3xl font-bold text-navy mt-1">87</p>
</div>
```

### Buttons
```jsx
{/* Primary */}
<button className="bg-navy-mid hover:bg-navy text-white
                   px-4 py-2 rounded-md text-sm font-medium transition-colors">
  Save
</button>

{/* Outline */}
<button className="border border-navy-mid text-navy-mid hover:bg-sky
                   px-4 py-2 rounded-md text-sm font-medium transition-colors">
  Cancel
</button>

{/* Danger */}
<button className="bg-danger hover:bg-[#7F1D1D] text-white
                   px-4 py-2 rounded-md text-sm font-medium transition-colors">
  Drop Student
</button>
```

### Input
```jsx
<input className="w-full bg-white border border-border rounded-md
                  px-3 py-2 text-sm text-navy
                  placeholder:text-blue/50
                  focus:outline-none focus:border-blue
                  focus:ring-2 focus:ring-blue/20
                  transition-all" />
```

### Table
```jsx
<div className="bg-white border border-border rounded-lg overflow-hidden">
  <table className="w-full">
    <thead>
      <tr className="bg-muted border-b border-border">
        <th className="text-left px-4 py-3 text-xs text-blue
                       uppercase tracking-wider font-medium">
          Name
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-border hover:bg-sky-pale
                     transition-colors cursor-pointer">
        <td className="px-4 py-3 text-sm text-navy">Ahmed Mohamed</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Status Badges
```jsx
{/* Active */}
<span className="text-xs font-medium px-2.5 py-0.5 rounded-full
                 bg-success-bg text-success">Active</span>

{/* Paused */}
<span className="text-xs font-medium px-2.5 py-0.5 rounded-full
                 bg-warning-bg text-warning">Paused</span>

{/* Dropped / Overdue */}
<span className="text-xs font-medium px-2.5 py-0.5 rounded-full
                 bg-danger-bg text-danger">Overdue</span>

{/* Info count */}
<span className="text-xs font-medium px-2.5 py-0.5 rounded-full
                 bg-sky text-navy">24 sessions</span>
```

### Attendance % Badge
```jsx
// pct >= 80 → green, 70-79 → amber, < 70 → red
const color =
  pct >= 80 ? 'bg-success-bg text-success' :
  pct >= 70 ? 'bg-warning-bg text-warning' :
              'bg-danger-bg text-danger';

<span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${color}`}>
  {pct}%
</span>
```

### Modal
```jsx
{/* Backdrop */}
<div className="fixed inset-0 bg-navy/50 flex items-center
                justify-center z-50 p-4">
  {/* Modal */}
  <div className="bg-white rounded-xl shadow-modal w-full max-w-md
                  max-h-[90vh] overflow-y-auto">
    {/* Header */}
    <div className="flex items-center justify-between px-5 py-4
                    border-b border-border">
      <h2 className="text-base font-semibold text-navy">Title</h2>
      <button className="p-1 rounded text-blue hover:bg-sky-pale">✕</button>
    </div>
    {/* Body */}
    <div className="p-5">...</div>
    {/* Footer */}
    <div className="flex justify-end gap-3 px-5 py-4
                    border-t border-border bg-muted/40">
      {/* buttons */}
    </div>
  </div>
</div>
```

### Progress Bar
```jsx
<div className="h-1.5 bg-sky rounded-full overflow-hidden">
  <div className="h-full bg-navy-mid rounded-full transition-all"
       style={{ width: `${pct}%` }} />
</div>
```

### Loading Skeleton
```jsx
<div className="h-4 bg-sky rounded animate-pulse w-3/4" />
```

### Empty State
```jsx
<div className="flex flex-col items-center py-16 text-center">
  <div className="w-12 h-12 rounded-xl bg-sky flex items-center
                  justify-center mb-4">
    <Icon className="w-6 h-6 text-navy-mid" />
  </div>
  <p className="text-base font-medium text-navy mb-1">No students yet</p>
  <p className="text-sm text-blue mb-5">Add a student to get started.</p>
  <button className="bg-navy-mid text-white px-4 py-2 rounded-md text-sm font-medium">
    Add Student
  </button>
</div>
```

---

## Rules (don't break these)

```
Sidebar          always bg-navy
Page bg          always bg-surface  — never pure white
Card bg          always bg-white with border-border
Primary button   one per page max — bg-navy-mid
Row hover        always hover:bg-sky-pale — never gray
Skeleton         always bg-sky animate-pulse — never gray
Backdrop         always bg-navy/50 — never black/50
Borders          always border-border — never gray-*
Body text        always text-navy
Secondary text   always text-blue
```
