interface CategoryFilterBarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryFilterBar({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterBarProps) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
            selectedCategory === category
              ? "border-brand bg-brand text-white"
              : "border-border bg-white text-foreground hover:border-brand hover:text-brand"
          }`}
        >
          {category === "all" ? "All Categories" : category}
        </button>
      ))}
    </div>
  );
}
