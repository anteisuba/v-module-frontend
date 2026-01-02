// components/ui/IconPicker.tsx

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  // Font Awesome
  FaTwitter,
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaGithub,
  FaFacebook,
  FaLinkedin,
  FaDiscord,
  FaTwitch,
  FaReddit,
  FaPinterest,
  FaSnapchat,
  FaTelegram,
  FaWeibo,
  // 通用图标
  FaLink,
  FaGlobe,
  FaEnvelope,
  FaPhone,
  FaHeart,
  FaStar,
  FaMusic,
  FaVideo,
  FaImage,
  FaHome,
  FaUser,
  FaCog,
  FaBell,
  FaSearch,
} from "react-icons/fa";
import {
  SiTiktok,
  SiYoutube,
  SiInstagram,
  SiGithub,
  SiFacebook,
  SiLinkedin,
  SiDiscord,
  SiTwitch,
  SiReddit,
  SiPinterest,
  SiSnapchat,
  SiTelegram,
  SiBilibili,
  SiX,
} from "react-icons/si";

// 图标配置类型
type IconConfig = {
  id: string; // 唯一标识符（用于存储）
  name: string; // 显示名称
  component: React.ComponentType<{ className?: string }>; // React 组件
  category: string; // 分类
  searchTerms: string[]; // 搜索关键词
};

// 定义可用的图标
const AVAILABLE_ICONS: IconConfig[] = [
  // 社交媒体 - Font Awesome
  {
    id: "FaTwitter",
    name: "Twitter (X)",
    component: FaTwitter,
    category: "社交媒体",
    searchTerms: ["twitter", "x", "推特"],
  },
  {
    id: "SiX",
    name: "X (Simple Icons)",
    component: SiX,
    category: "社交媒体",
    searchTerms: ["x", "twitter", "推特"],
  },
  {
    id: "FaYoutube",
    name: "YouTube",
    component: FaYoutube,
    category: "社交媒体",
    searchTerms: ["youtube", "yt", "油管"],
  },
  {
    id: "FaInstagram",
    name: "Instagram",
    component: FaInstagram,
    category: "社交媒体",
    searchTerms: ["instagram", "ig", "ins"],
  },
  {
    id: "FaTiktok",
    name: "TikTok",
    component: FaTiktok,
    category: "社交媒体",
    searchTerms: ["tiktok", "抖音"],
  },
  {
    id: "FaGithub",
    name: "GitHub",
    component: FaGithub,
    category: "社交媒体",
    searchTerms: ["github", "git", "代码"],
  },
  {
    id: "FaFacebook",
    name: "Facebook",
    component: FaFacebook,
    category: "社交媒体",
    searchTerms: ["facebook", "fb", "脸书"],
  },
  {
    id: "FaLinkedin",
    name: "LinkedIn",
    component: FaLinkedin,
    category: "社交媒体",
    searchTerms: ["linkedin", "领英"],
  },
  {
    id: "FaDiscord",
    name: "Discord",
    component: FaDiscord,
    category: "社交媒体",
    searchTerms: ["discord", "dc"],
  },
  {
    id: "FaTwitch",
    name: "Twitch",
    component: FaTwitch,
    category: "社交媒体",
    searchTerms: ["twitch", "直播"],
  },
  {
    id: "FaReddit",
    name: "Reddit",
    component: FaReddit,
    category: "社交媒体",
    searchTerms: ["reddit"],
  },
  {
    id: "FaPinterest",
    name: "Pinterest",
    component: FaPinterest,
    category: "社交媒体",
    searchTerms: ["pinterest"],
  },
  {
    id: "FaSnapchat",
    name: "Snapchat",
    component: FaSnapchat,
    category: "社交媒体",
    searchTerms: ["snapchat"],
  },
  {
    id: "FaTelegram",
    name: "Telegram",
    component: FaTelegram,
    category: "社交媒体",
    searchTerms: ["telegram", "tg", "电报"],
  },
  {
    id: "FaWeibo",
    name: "Weibo",
    component: FaWeibo,
    category: "社交媒体",
    searchTerms: ["weibo", "微博"],
  },
  // Simple Icons 版本（品牌色）
  {
    id: "SiTiktok",
    name: "TikTok (品牌)",
    component: SiTiktok,
    category: "社交媒体",
    searchTerms: ["tiktok", "抖音", "品牌"],
  },
  {
    id: "SiYoutube",
    name: "YouTube (品牌)",
    component: SiYoutube,
    category: "社交媒体",
    searchTerms: ["youtube", "品牌"],
  },
  {
    id: "SiInstagram",
    name: "Instagram (品牌)",
    component: SiInstagram,
    category: "社交媒体",
    searchTerms: ["instagram", "品牌"],
  },
  {
    id: "SiGithub",
    name: "GitHub (品牌)",
    component: SiGithub,
    category: "社交媒体",
    searchTerms: ["github", "品牌"],
  },
  {
    id: "SiFacebook",
    name: "Facebook (品牌)",
    component: SiFacebook,
    category: "社交媒体",
    searchTerms: ["facebook", "品牌"],
  },
  {
    id: "SiLinkedin",
    name: "LinkedIn (品牌)",
    component: SiLinkedin,
    category: "社交媒体",
    searchTerms: ["linkedin", "品牌"],
  },
  {
    id: "SiDiscord",
    name: "Discord (品牌)",
    component: SiDiscord,
    category: "社交媒体",
    searchTerms: ["discord", "品牌"],
  },
  {
    id: "SiTwitch",
    name: "Twitch (品牌)",
    component: SiTwitch,
    category: "社交媒体",
    searchTerms: ["twitch", "品牌"],
  },
  {
    id: "SiReddit",
    name: "Reddit (品牌)",
    component: SiReddit,
    category: "社交媒体",
    searchTerms: ["reddit", "品牌"],
  },
  {
    id: "SiPinterest",
    name: "Pinterest (品牌)",
    component: SiPinterest,
    category: "社交媒体",
    searchTerms: ["pinterest", "品牌"],
  },
  {
    id: "SiSnapchat",
    name: "Snapchat (品牌)",
    component: SiSnapchat,
    category: "社交媒体",
    searchTerms: ["snapchat", "品牌"],
  },
  {
    id: "SiTelegram",
    name: "Telegram (品牌)",
    component: SiTelegram,
    category: "社交媒体",
    searchTerms: ["telegram", "品牌"],
  },
  {
    id: "SiBilibili",
    name: "Bilibili (品牌)",
    component: SiBilibili,
    category: "社交媒体",
    searchTerms: ["bilibili", "b站", "品牌"],
  },
  // 通用图标
  {
    id: "FaLink",
    name: "链接",
    component: FaLink,
    category: "通用",
    searchTerms: ["link", "链接"],
  },
  {
    id: "FaGlobe",
    name: "地球",
    component: FaGlobe,
    category: "通用",
    searchTerms: ["globe", "地球", "网站"],
  },
  {
    id: "FaEnvelope",
    name: "邮箱",
    component: FaEnvelope,
    category: "通用",
    searchTerms: ["email", "邮箱", "邮件"],
  },
  {
    id: "FaPhone",
    name: "电话",
    component: FaPhone,
    category: "通用",
    searchTerms: ["phone", "电话"],
  },
  {
    id: "FaHeart",
    name: "爱心",
    component: FaHeart,
    category: "通用",
    searchTerms: ["heart", "爱心", "喜欢"],
  },
  {
    id: "FaStar",
    name: "星星",
    component: FaStar,
    category: "通用",
    searchTerms: ["star", "星星"],
  },
  {
    id: "FaMusic",
    name: "音乐",
    component: FaMusic,
    category: "通用",
    searchTerms: ["music", "音乐"],
  },
  {
    id: "FaVideo",
    name: "视频",
    component: FaVideo,
    category: "通用",
    searchTerms: ["video", "视频"],
  },
  {
    id: "FaImage",
    name: "图片",
    component: FaImage,
    category: "通用",
    searchTerms: ["image", "图片"],
  },
  {
    id: "FaHome",
    name: "首页",
    component: FaHome,
    category: "通用",
    searchTerms: ["home", "首页"],
  },
  {
    id: "FaUser",
    name: "用户",
    component: FaUser,
    category: "通用",
    searchTerms: ["user", "用户"],
  },
  {
    id: "FaCog",
    name: "设置",
    component: FaCog,
    category: "通用",
    searchTerms: ["settings", "设置"],
  },
  {
    id: "FaBell",
    name: "通知",
    component: FaBell,
    category: "通用",
    searchTerms: ["bell", "通知"],
  },
  {
    id: "FaSearch",
    name: "搜索",
    component: FaSearch,
    category: "通用",
    searchTerms: ["search", "搜索"],
  },
];

// 图标 ID 到组件的映射（用于渲染）
export const ICON_COMPONENT_MAP: Record<string, React.ComponentType<{ className?: string }>> = {};

// 初始化映射表
AVAILABLE_ICONS.forEach((icon) => {
  ICON_COMPONENT_MAP[icon.id] = icon.component;
});

interface IconPickerProps {
  value?: string;
  onChange: (iconId: string) => void;
  disabled?: boolean;
}

export function IconPicker({ value, onChange, disabled = false }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null); // 按钮引用，用于检查点击来源

  // 获取所有分类
  const categories = useMemo(() => {
    const cats = new Set(AVAILABLE_ICONS.map((icon) => icon.category));
    return ["全部", ...Array.from(cats)];
  }, []);

  // 过滤图标
  const filteredIcons = useMemo(() => {
    let icons = AVAILABLE_ICONS;

    // 按分类过滤
    if (selectedCategory !== "全部") {
      icons = icons.filter((icon) => icon.category === selectedCategory);
    }

    // 按搜索关键词过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      icons = icons.filter((icon) =>
        icon.name.toLowerCase().includes(query) ||
        icon.searchTerms.some((term) => term.toLowerCase().includes(query))
      );
    }

    return icons;
  }, [searchQuery, selectedCategory]);

  // 获取当前选中的图标组件
  const SelectedIcon = useMemo(() => {
    if (!value) return null;
    const icon = AVAILABLE_ICONS.find((icon) => icon.id === value);
    return icon?.component || null;
  }, [value]);

  // 选择图标
  function handleSelectIcon(icon: IconConfig) {
    onChange(icon.id);
    setIsOpen(false);
    setSearchQuery("");
  }

  // 计算弹窗宽度（absolute 定位不需要计算 top/left）
  useEffect(() => {
    if (isOpen && containerRef.current && typeof window !== "undefined") {
      const updateWidth = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setPosition({
            top: 0,
            left: 0,
            width: rect.width,
          });
        }
      };

      // 使用 requestAnimationFrame 确保 DOM 已更新
      requestAnimationFrame(() => {
        updateWidth();
      });

      // 监听窗口大小变化
      window.addEventListener("resize", updateWidth);

      return () => {
        window.removeEventListener("resize", updateWidth);
      };
    }
  }, [isOpen]);

  // 全局点击监听器 - 不使用事件冒泡
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as Node;
      
      // 检查点击是否来自按钮
      if (buttonRef.current && buttonRef.current.contains(target)) {
        return; // 点击按钮，不关闭（按钮有自己的处理逻辑）
      }
      
      // 检查点击是否来自弹窗内容
      if (popupRef.current && popupRef.current.contains(target)) {
        return; // 点击弹窗内容，不关闭
      }
      
      // 检查点击是否来自输入框
      if (containerRef.current && containerRef.current.contains(target)) {
        return; // 点击输入框，不关闭
      }
      
      // 其他所有点击都关闭弹窗
      setIsOpen(false);
    };

    // 延迟添加监听器，避免立即触发
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleDocumentClick);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [isOpen]);

  // 处理弹窗内容点击 - 阻止事件冒泡（虽然不使用冒泡，但保留以防万一）
  function handlePopupClick(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
  }

  // 处理图标按钮点击
  function handleIconClick(icon: IconConfig, e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    handleSelectIcon(icon);
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* 图标显示和选择按钮 */}
      <div className="flex items-center gap-2">
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (!disabled) {
              setIsOpen((prev) => !prev);
            }
          }}
          disabled={disabled}
          className={[
            "flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 bg-white/70 transition-colors",
            disabled ? "cursor-not-allowed opacity-50" : "hover:bg-white/90",
          ].join(" ")}
          aria-label="选择图标"
        >
          {SelectedIcon ? (
            <SelectedIcon className="h-5 w-5 text-black" />
          ) : (
            <FaLink className="h-5 w-5 text-black/50" />
          )}
        </button>

        <input
          type="text"
          value={value ? AVAILABLE_ICONS.find((icon) => icon.id === value)?.name || value : ""}
          onChange={(e) => {
            // 允许手动输入（支持 emoji 或文字）
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
            }
          }}
          disabled={disabled}
          placeholder="选择图标或输入 emoji/文字"
          className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black placeholder:text-black/30"
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={disabled}
            className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            清除
          </button>
        )}
      </div>

      {/* 图标选择器弹窗 - 使用 absolute 定位 */}
      {isOpen && !disabled && (
        <div
          ref={popupRef}
          className="absolute left-0 top-full z-[10000] mt-2 w-full min-w-[400px] rounded-xl border border-black/10 bg-white shadow-2xl"
          onClick={handlePopupClick}
        >
            {/* 搜索和分类 */}
            <div className="border-b border-black/10 p-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索图标..."
                className="mb-3 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black"
              />

              {/* 分类标签 */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={[
                      "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                      selectedCategory === category
                        ? "bg-black text-white"
                        : "bg-black/5 text-black hover:bg-black/10",
                    ].join(" ")}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* 图标网格 */}
            <div className="max-h-64 overflow-y-auto p-4">
              {filteredIcons.length === 0 ? (
                <div className="py-8 text-center text-sm text-black/60">
                  未找到匹配的图标
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-3">
                  {filteredIcons.map((icon) => {
                    const IconComponent = icon.component;
                    const isSelected = value === icon.id;

                    return (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={(e) => handleIconClick(icon, e)}
                        className={[
                          "flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors cursor-pointer",
                          isSelected
                            ? "border-black bg-black/5"
                            : "border-black/10 hover:border-black/30 hover:bg-black/5",
                        ].join(" ")}
                        title={icon.name}
                      >
                        <IconComponent className="h-6 w-6 text-black" />
                        <span className="text-[10px] text-black/70 line-clamp-1">
                          {icon.name.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
        </div>
      )}
    </div>
  );
}
