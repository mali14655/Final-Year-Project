const CATEGORY_STYLES = {
  pain: { label: "Pain", className: "insight-tag-pain" },
  need: { label: "Need", className: "insight-tag-need" },
  opportunity: { label: "Opportunity", className: "insight-tag-opportunity" },
  feature: { label: "Feature", className: "insight-tag-feature" },
  quote: { label: "Quote", className: "insight-tag-quote" },
  sentiment: { label: "Sentiment", className: "insight-tag-sentiment" },
};

function InsightTag({ category }) {
  if (!category) return null;

  const key = category.toLowerCase();
  const style = CATEGORY_STYLES[key] || {
    label: category,
    className: "insight-tag-default",
  };

  return <span className={`insight-tag ${style.className}`}>{style.label}</span>;
}

export function getInsightCategoryLabel(category) {
  const key = category?.toLowerCase();
  return CATEGORY_STYLES[key]?.label || category || "Insight";
}

export default InsightTag;
