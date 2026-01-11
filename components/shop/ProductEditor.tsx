// components/shop/ProductEditor.tsx

"use client";

import { useState, useEffect } from "react";
import { Input, Button, FormField, Alert, LoadingState } from "@/components/ui";
import { pageApi, shopApi } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useI18n } from "@/lib/i18n/context";

interface ProductEditorProps {
  initialData?: {
    id?: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    images: string[];
    status: string;
  };
  productId?: string | null;
  onSave: (data: {
    name: string;
    description: string | null;
    price: number;
    stock: number;
    images: string[];
    status: string;
  }) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export default function ProductEditor({
  initialData,
  productId,
  onSave,
  onCancel,
  saving = false,
}: ProductEditorProps) {
  const { t } = useI18n();
  const { message: toastMessage, showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [price, setPrice] = useState(
    initialData?.price?.toString() || "0.00"
  );
  const [stock, setStock] = useState(initialData?.stock?.toString() || "0");
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [status, setStatus] = useState(initialData?.status || "DRAFT");
  const [uploadingImages, setUploadingImages] = useState<number[]>([]);
  const [relatedOrders, setRelatedOrders] = useState<any[]>([]);

  // 加载相关订单
  useEffect(() => {
    if (productId) {
      loadRelatedOrders();
    }
  }, [productId]);

  async function loadRelatedOrders() {
    // 这里可以调用 API 获取相关订单
    // 暂时留空，后续可以实现
  }

  // 上传图片
  async function handleImageUpload(file: File, index?: number) {
    try {
      if (index !== undefined) {
        setUploadingImages([...uploadingImages, index]);
      } else {
        setUploadingImages([...uploadingImages, images.length]);
      }
      const result = await pageApi.uploadImage(file);
      if (index !== undefined) {
        // 替换指定位置的图片
        const updated = [...images];
        updated[index] = result.src;
        setImages(updated);
      } else {
        // 添加新图片
        setImages([...images, result.src]);
      }
      showToast(t("common.success"));
    } catch (err) {
      handleError(err);
    } finally {
      if (index !== undefined) {
        setUploadingImages(uploadingImages.filter((i) => i !== index));
      } else {
        setUploadingImages(uploadingImages.slice(0, -1));
      }
    }
  }

  // 删除图片
  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  // 保存
  async function handleSave() {
    if (!name.trim()) {
      showToast(t("shop.form.name") + " 不能为空");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast(t("shop.form.price") + " 格式不正确");
      return;
    }

    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 0) {
      showToast(t("shop.form.stock") + " 格式不正确");
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        price: priceNum,
        stock: stockNum,
        images,
        status,
      });
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast 提示 */}
      {toastMessage && <Alert type="success" message={toastMessage} />}

      {/* 错误提示 */}
      {error && <Alert type="error" message={error} onClose={clearError} />}

      {/* 商品名称 */}
      <FormField label={t("shop.form.name")} required>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("shop.form.namePlaceholder")}
          disabled={saving}
        />
      </FormField>

      {/* 商品描述 */}
      <FormField label={t("shop.form.description")}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("shop.form.descriptionPlaceholder")}
          disabled={saving}
          rows={5}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black placeholder:text-black/30 transition-colors focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-1 resize-y"
        />
      </FormField>

      {/* 价格 */}
      <FormField label={t("shop.form.price")} required>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs text-black/50">
            ¥
          </span>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={t("shop.form.pricePlaceholder")}
            disabled={saving}
            className="pl-8"
          />
        </div>
      </FormField>

      {/* 库存 */}
      <FormField label={t("shop.form.stock")}>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder={t("shop.form.stockPlaceholder")}
            disabled={saving}
            className="flex-1"
          />
          <div className="flex gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const current = parseInt(stock) || 0;
                setStock(Math.max(0, current - 1).toString());
              }}
              disabled={saving}
            >
              -
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const current = parseInt(stock) || 0;
                setStock((current + 1).toString());
              }}
              disabled={saving}
            >
              +
            </Button>
          </div>
        </div>
      </FormField>

      {/* 状态 */}
      <FormField label={t("shop.form.status")}>
        <div className="flex gap-3">
          {["DRAFT", "PUBLISHED", "ARCHIVED"].map((s) => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value={s}
                checked={status === s}
                onChange={(e) => setStatus(e.target.value)}
                disabled={saving}
                className="w-4 h-4"
              />
              <span className="text-xs text-black">
                {s === "DRAFT"
                  ? t("shop.list.draft")
                  : s === "PUBLISHED"
                  ? t("shop.list.published")
                  : t("shop.list.archived")}
              </span>
            </label>
          ))}
        </div>
      </FormField>

      {/* 商品图片 */}
      <FormField label={t("shop.form.images")}>
        <div className="space-y-4">
          {/* 图片网格 */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Product ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-black/10"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={saving}
                  >
                    ×
                  </button>
                  {uploadingImages.includes(index) && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <LoadingState type="spinner" size="sm" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 上传按钮 */}
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                files.forEach((file) => {
                  handleImageUpload(file);
                });
              }}
              disabled={saving || uploadingImages.length > 0}
              className="hidden"
              id="product-images-upload"
            />
            <label
              htmlFor="product-images-upload"
              className="inline-block rounded-lg border border-black/20 bg-white/70 px-4 py-2 text-xs font-medium text-black hover:bg-white/80 cursor-pointer disabled:opacity-50"
            >
              {uploadingImages.length > 0
                ? t("common.uploading")
                : images.length === 0
                ? t("common.add") + " " + t("shop.form.images")
                : t("common.add") + " " + t("shop.form.images")}
            </label>
          </div>
        </div>
      </FormField>

      {/* 相关订单（如果有） */}
      {productId && relatedOrders.length > 0 && (
        <div className="pt-4 border-t border-black/10">
          <h3 className="text-sm font-semibold text-black mb-2">相关订单</h3>
          <div className="space-y-2">
            {relatedOrders.map((order) => (
              <div
                key={order.id}
                className="p-3 bg-white/50 rounded-lg border border-black/10"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-black">
                      订单 #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-black/60">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      order.status === "PAID"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          {t("shop.form.cancel")}
        </Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          {t("shop.form.save")}
        </Button>
      </div>
    </div>
  );
}
