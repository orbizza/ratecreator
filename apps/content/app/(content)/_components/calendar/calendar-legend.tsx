"use client";

export function CalendarLegend(): JSX.Element {
  const legendItems = [
    { color: "bg-green-500", label: "Published" },
    { color: "bg-blue-500", label: "Scheduled" },
    { color: "bg-purple-500", label: "Newsletter" },
    { color: "bg-yellow-500", label: "Idea" },
  ];

  return (
    <div className="flex items-center gap-4">
      {legendItems.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded ${item.color}`} />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
