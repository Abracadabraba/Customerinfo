import React, { useState } from 'react';
import { listRecords, deleteRecord, currentVersionLabel } from '../utils/db';
import { generateDocxBlob } from '../utils/exportDocx';
import { saveBlobAsFile } from '../utils/saveFile';

export default function RecordList({ onCreateNew, onEdit }) {
  const [records, setRecords] = useState(() => listRecords());
  const [query, setQuery] = useState('');

  function refresh() {
    setRecords(listRecords());
  }

  function handleDelete(id) {
    if (window.confirm('确定删除该客户记录吗？此操作不可恢复。\nDelete this record permanently?')) {
      deleteRecord(id);
      refresh();
    }
  }

  async function handleExport(record) {
    const blob = await generateDocxBlob(record);
    const safeName = (record.data.basic?.company || record.data.basic?.name || record.id).replace(
      /[^\w\-]+/g,
      '_'
    );
    const versionTag = record.history.length === 0 ? 'orig' : 'R' + record.history.length;
    await saveBlobAsFile(blob, `客户信息登记表_${safeName}_${versionTag}.docx`);
  }

  const filtered = records.filter((r) => {
    const b = r.data.basic || {};
    const haystack = `${b.name || ''} ${b.company || ''} ${b.country || ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="record-list">
      <div className="list-header">
        <h1>客户信息登记 / Customer Registration</h1>
        <button className="btn primary" onClick={onCreateNew}>
          + 新建客户 / New Customer
        </button>
      </div>
      <input
        className="search-box"
        placeholder="搜索 姓名/公司/国家 / Search name, company, country..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length === 0 && (
        <p className="empty-hint">暂无记录，点击右上角新建。/ No records yet.</p>
      )}

      <ul className="records">
        {filtered.map((r) => {
          const b = r.data.basic || {};
          return (
            <li key={r.id} className="record-card">
              <div className="record-main" onClick={() => onEdit(r)}>
                <div className="record-title">
                  {b.company || '未命名公司'} — {b.name || '未填写姓名'}
                </div>
                <div className="record-sub">
                  {b.country || ''} · 版本 {currentVersionLabel(r)} · 更新于{' '}
                  {new Date(r.updatedAt).toLocaleString()}
                </div>
              </div>
              <div className="record-actions">
                <button className="btn small" onClick={() => onEdit(r)}>
                  编辑 / Edit
                </button>
                <button className="btn small" onClick={() => handleExport(r)}>
                  导出 / Export
                </button>
                <button className="btn small danger" onClick={() => handleDelete(r.id)}>
                  删除 / Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
