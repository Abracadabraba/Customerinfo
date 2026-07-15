import React, { useMemo, useState } from 'react';
import FieldRenderer from './FieldRenderer';
import {
  PRODUCT_LIST,
  PRODUCT_FIELDS,
  GMP_FIELDS,
  COMMUNICATION_PERSONS,
  BASIC_INFO_FIELDS,
} from '../data/formSchema';
import { createRecord, updateRecord } from '../utils/db';
import { generateDocxBlob } from '../utils/exportDocx';
import { saveBlobAsFile } from '../utils/saveFile';

const emptyData = () => ({
  basic: {},
  products: [],
  productDetails: {},
  gmp: {},
  communication: { persons: [], otherPerson: '', memo: '' },
});

export default function FormWizard({ existingRecord, onDone, onCancel }) {
  const [data, setData] = useState(() => existingRecord?.data || emptyData());
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const selectedProducts = data.products || [];

  const steps = useMemo(() => {
    const s = ['basic'];
    selectedProducts.forEach((p) => s.push('product:' + p));
    s.push('gmp', 'communication', 'review');
    return s;
  }, [selectedProducts]);

  const currentStep = steps[stepIndex];

  function updateBasic(key, value) {
    setData((d) => ({ ...d, basic: { ...d.basic, [key]: value } }));
  }

  function toggleProduct(key) {
    setData((d) => {
      const has = d.products.includes(key);
      const products = has ? d.products.filter((p) => p !== key) : [...d.products, key];
      return { ...d, products };
    });
  }

  function updateOtherProductText(value) {
    setData((d) => ({ ...d, basic: { ...d.basic, otherProductText: value } }));
  }

  function updateProductDetail(productKey, fieldKey, value) {
    setData((d) => ({
      ...d,
      productDetails: {
        ...d.productDetails,
        [productKey]: {
          ...d.productDetails[productKey],
          [fieldKey]: value,
        },
      },
    }));
  }

  function updateGmp(fieldKey, value) {
    setData((d) => ({ ...d, gmp: { ...d.gmp, [fieldKey]: value } }));
  }

  function toggleCommunicationPerson(person) {
    setData((d) => {
      const has = (d.communication.persons || []).includes(person);
      const persons = has
        ? d.communication.persons.filter((p) => p !== person)
        : [...(d.communication.persons || []), person];
      return { ...d, communication: { ...d.communication, persons } };
    });
  }

  function updateCommunication(key, value) {
    setData((d) => ({ ...d, communication: { ...d.communication, [key]: value } }));
  }

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }
  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function handleSave() {
    setSaving(true);
    let record;
    if (existingRecord) {
      record = updateRecord(existingRecord.id, data);
      setSavedMessage(
        `已保存为新版本 ${'R' + record.history.length} / Saved as new version R${record.history.length}`
      );
    } else {
      record = createRecord(data);
      setSavedMessage('已创建新客户记录 / New record created');
    }
    setSaving(false);
    return record;
  }

  async function handleSaveAndExit() {
    const record = await handleSave();
    onDone(record);
  }

  async function handleExportDocx() {
    const record = await handleSave();
    const blob = await generateDocxBlob(record);
    const safeName = (data.basic.company || data.basic.name || record.id).replace(/[^\w\-]+/g, '_');
    const versionTag = record.history.length === 0 ? 'orig' : 'R' + record.history.length;
    await saveBlobAsFile(blob, `客户信息登记表_${safeName}_${versionTag}.docx`);
  }

  return (
    <div className="wizard">
      <div className="wizard-progress">
        步骤 {stepIndex + 1} / {steps.length}
      </div>

      {currentStep === 'basic' && (
        <div className="step">
          <h2>展会 & 客户信息 / Event & Customer Info</h2>
          <h3>Event / 展会</h3>
          {BASIC_INFO_FIELDS.event.map((f) => (
            <FieldRenderer
              key={f.key}
              field={f}
              value={data.basic[f.key] ?? f.default}
              onChange={updateBasic}
            />
          ))}
          <h3>1. Customer Information / 客户信息</h3>
          {BASIC_INFO_FIELDS.customer.map((f) => (
            <FieldRenderer key={f.key} field={f} value={data.basic[f.key]} onChange={updateBasic} />
          ))}

          <h3>Products of Interest / 意向产品（多选）</h3>
          <div className="checkbox-group">
            {PRODUCT_LIST.map((p) => (
              <label key={p.key} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(p.key)}
                  onChange={() => toggleProduct(p.key)}
                />
                {p.label}
              </label>
            ))}
          </div>
          {selectedProducts.includes('others') && (
            <input
              type="text"
              className="other-input"
              placeholder="请描述其他产品 / Describe other product..."
              value={data.basic.otherProductText || ''}
              onChange={(e) => updateOtherProductText(e.target.value)}
            />
          )}
        </div>
      )}

      {currentStep.startsWith('product:') && (
        <ProductStep
          productKey={currentStep.split(':')[1]}
          data={data}
          updateProductDetail={updateProductDetail}
        />
      )}

      {currentStep === 'gmp' && (
        <div className="step">
          <h2>3. GMP Compliance & Process Requirements / GMP合规与工艺要求</h2>
          {GMP_FIELDS.map((f) => (
            <FieldRenderer key={f.key} field={f} value={data.gmp[f.key]} onChange={updateGmp} />
          ))}
          <div className="field">
            <label>备注 / Remark (以防有未尽事宜)</label>
            <textarea
              rows={3}
              value={data.gmp.remark || ''}
              onChange={(e) => updateGmp('remark', e.target.value)}
              placeholder="补充说明..."
            />
          </div>
        </div>
      )}

      {currentStep === 'communication' && (
        <div className="step">
          <h2>4. Communication Records / 沟通记录</h2>
          <div className="field">
            <label>Participants in the discussion / 参与沟通人员</label>
            <div className="checkbox-group">
              {COMMUNICATION_PERSONS.map((p) => (
                <label key={p} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={(data.communication.persons || []).includes(p)}
                    onChange={() => toggleCommunicationPerson(p)}
                  />
                  {p}
                </label>
              ))}
            </div>
            <input
              type="text"
              className="other-input"
              placeholder="其他 / Other (手动输入姓名)"
              value={data.communication.otherPerson || ''}
              onChange={(e) => updateCommunication('otherPerson', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Memo / 备注</label>
            <textarea
              rows={5}
              value={data.communication.memo || ''}
              onChange={(e) => updateCommunication('memo', e.target.value)}
              placeholder="沟通详情、跟进事项..."
            />
          </div>
        </div>
      )}

      {currentStep === 'review' && (
        <div className="step">
          <h2>确认 & 保存 / Review & Save</h2>
          <p>请检查以上信息无误后保存或导出。</p>
          {savedMessage && <div className="saved-banner">{savedMessage}</div>}
          <div className="review-actions">
            <button className="btn primary" disabled={saving} onClick={handleSave}>
              保存 / Save
            </button>
            <button className="btn" disabled={saving} onClick={handleExportDocx}>
              导出 Word 文档 / Export .docx
            </button>
            <button className="btn secondary" onClick={handleSaveAndExit}>
              保存并返回列表 / Save & Back to list
            </button>
          </div>
        </div>
      )}

      <div className="wizard-nav">
        <button className="btn" onClick={onCancel}>
          取消 / Cancel
        </button>
        <div className="spacer" />
        <button className="btn" onClick={goBack} disabled={stepIndex === 0}>
          上一步 / Back
        </button>
        <button className="btn primary" onClick={goNext} disabled={stepIndex === steps.length - 1}>
          下一步 / Next
        </button>
      </div>
    </div>
  );
}

function ProductStep({ productKey, data, updateProductDetail }) {
  const fields = PRODUCT_FIELDS[productKey] || [];
  const productMeta = PRODUCT_LIST.find((p) => p.key === productKey);
  const detail = data.productDetails[productKey] || {};
  return (
    <div className="step">
      <h2>{productMeta?.label}</h2>
      {fields.map((f) => (
        <FieldRenderer
          key={f.key}
          field={f}
          value={detail[f.key]}
          onChange={(k, v) => updateProductDetail(productKey, k, v)}
        />
      ))}
      <div className="field">
        <label>备注 / Remark (以防有未尽事宜)</label>
        <textarea
          rows={3}
          value={detail.remark || ''}
          onChange={(e) => updateProductDetail(productKey, 'remark', e.target.value)}
          placeholder="补充说明..."
        />
      </div>
    </div>
  );
}
