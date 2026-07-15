import React from 'react';

export default function FieldRenderer({ field, value, onChange }) {
  const update = (newVal) => onChange(field.key, newVal);

  if (field.type === 'text') {
    return (
      <div className="field">
        <label>{field.label}</label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => update(e.target.value)}
          placeholder="请输入 / Enter..."
        />
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="field">
        <label>{field.label}</label>
        <textarea
          rows={4}
          value={value || ''}
          onChange={(e) => update(e.target.value)}
          placeholder="请输入 / Enter..."
        />
      </div>
    );
  }

  if (field.type === 'checkboxGroup') {
    const selected = value?.selected || [];
    const other = value?.other || '';
    const toggle = (opt) => {
      const next = selected.includes(opt)
        ? selected.filter((o) => o !== opt)
        : [...selected, opt];
      update({ ...value, selected: next });
    };
    return (
      <div className="field">
        <label>{field.label}</label>
        <div className="checkbox-group">
          {field.options.map((opt) => (
            <label key={opt} className="checkbox-item">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
        {field.allowOther && (
          <input
            type="text"
            className="other-input"
            placeholder="Other / 其他..."
            value={other}
            onChange={(e) => update({ ...value, other: e.target.value })}
          />
        )}
      </div>
    );
  }

  if (field.type === 'radioGroup') {
    const selected = value?.selected || '';
    const detail = value?.detail || '';
    return (
      <div className="field">
        <label>{field.label}</label>
        <div className="checkbox-group">
          {field.options.map((opt) => (
            <label key={opt} className="checkbox-item">
              <input
                type="radio"
                name={field.key}
                checked={selected === opt}
                onChange={() => update({ ...value, selected: opt })}
              />
              {opt}
            </label>
          ))}
        </div>
        {field.allowOtherDetailText && (
          <input
            type="text"
            className="other-input"
            placeholder="详情 / Details..."
            value={detail}
            onChange={(e) => update({ ...value, detail: e.target.value })}
          />
        )}
      </div>
    );
  }

  if (field.type === 'powerSpec') {
    const v = value || {};
    return (
      <div className="field">
        <label>{field.label}</label>
        <div className="power-spec-row">
          <input
            type="text"
            placeholder="V"
            value={v.voltage || ''}
            onChange={(e) => update({ ...v, voltage: e.target.value })}
          />
          <span>V</span>
          <input
            type="text"
            placeholder="Hz"
            value={v.hz || ''}
            onChange={(e) => update({ ...v, hz: e.target.value })}
          />
          <span>Hz</span>
          <select
            value={v.phase || ''}
            onChange={(e) => update({ ...v, phase: e.target.value })}
          >
            <option value="">--</option>
            <option value="3-phase">3-phase / 三相</option>
            <option value="1-phase">1-phase / 单相</option>
          </select>
        </div>
      </div>
    );
  }

  return null;
}
