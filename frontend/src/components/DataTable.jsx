/**
 * Responsive table: a normal table on tablets/desktops, stacked cards on phones.
 * columns: [{ key, header, render?(row), primary?, hideOnTablet? }]
 * actions: (row) => JSX
 */
export default function DataTable({ columns, rows, rowKey, actions, caption }) {
  return (
    <>
      {/* md and up: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-collapse">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((c) => <th key={c.key} scope="col" className={`th ${c.hideOnTablet ? 'hidden xl:table-cell' : ''}`}>{c.header}</th>)}
              {actions && <th scope="col" className="th text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-brand-50/40">
                {columns.map((c) => (
                  <td key={c.key} className={`td ${c.hideOnTablet ? 'hidden xl:table-cell' : ''} ${c.primary ? 'font-semibold' : ''}`}>
                    {c.render ? c.render(row) : row[c.key] ?? '-'}
                  </td>
                ))}
                {actions && <td className="td"><div className="flex justify-end gap-1.5">{actions(row)}</div></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* below md: cards */}
      <ul className="divide-y divide-line md:hidden">
        {rows.map((row) => {
          const primary = columns.find((c) => c.primary) || columns[0];
          const rest = columns.filter((c) => c !== primary);
          return (
            <li key={rowKey(row)} className="p-4">
              <p className="break-words text-base font-semibold">{primary.render ? primary.render(row) : row[primary.key]}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                {rest.map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className="text-xs text-muted">{c.header}</dt>
                    <dd className="break-words">{c.render ? c.render(row) : row[c.key] ?? '-'}</dd>
                  </div>
                ))}
              </dl>
              {actions && <div className="mt-3 flex flex-wrap gap-2">{actions(row)}</div>}
            </li>
          );
        })}
      </ul>
    </>
  );
}
