// lib/utils/iconRenderer.tsx

import {
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

// 图标映射表
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FaTwitter,
  SiX,
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
};

/**
 * 根据图标 ID 获取 React 图标组件
 */
export function getIconComponent(iconId: string): React.ComponentType<{ className?: string }> | null {
  return ICON_MAP[iconId] || null;
}

/**
 * 渲染图标
 * 支持：
 * 1. react-icons 图标（格式：icon:FaTwitter）
 * 2. 图片 URL（http/https 或本地路径，包含图片扩展名）
 * 3. emoji 或文字
 */
export function renderIcon(
  icon: string | undefined,
  fallbackName: string,
  className?: string
): React.ReactNode {
  if (!icon) {
    return <span>{fallbackName}</span>;
  }

  // 检查是否是 react-icons 图标（格式：icon:FaTwitter）
  if (icon.startsWith("icon:")) {
    const iconId = icon.replace("icon:", "");
    const IconComponent = getIconComponent(iconId);
    if (IconComponent) {
      return <IconComponent className={className || "h-5 w-5"} />;
    }
    // 如果找不到对应的图标组件，返回 fallback
    return <span>{fallbackName}</span>;
  }

  // 检查是否是图片 URL
  const isImageUrl = (str: string): boolean => {
    if (!str) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico'];
    const lowerStr = str.toLowerCase();
    const isExternalUrl = str.startsWith("http://") || str.startsWith("https://");
    if (isExternalUrl) {
      return imageExtensions.some(ext => lowerStr.includes(ext));
    }
    if (str.startsWith('/')) {
      return imageExtensions.some(ext => lowerStr.includes(ext));
    }
    return false;
  };

  if (isImageUrl(icon)) {
    const isExternalUrl = icon.startsWith("http://") || icon.startsWith("https://");
    if (isExternalUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={icon}
          alt={fallbackName}
          className={className || "h-5 w-5 object-contain"}
          style={{ display: 'inline-block' }}
        />
      );
    } else {
      // 对于本地图片，需要使用 Next.js Image，但这里返回 img 标签以便在客户端使用
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={icon}
          alt={fallbackName}
          className={className || "h-5 w-5 object-contain"}
          style={{ display: 'inline-block' }}
        />
      );
    }
  }

  // 否则作为文字或 emoji 直接显示
  return <span>{icon}</span>;
}

