import { FaReact, FaPython, FaJava, FaHtml5, FaCss3Alt, FaMarkdown, FaGitAlt } from "react-icons/fa";
import { SiTypescript, SiJavascript, SiJson, SiRust, SiGo } from "react-icons/si";
import { VscFile } from "react-icons/vsc";

interface FileIconProps {
  extension: string;
}

const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
  tsx: { icon: FaReact, color: "text-info" },
  jsx: { icon: FaReact, color: "text-info" },
  ts: { icon: SiTypescript, color: "text-info" },
  js: { icon: SiJavascript, color: "text-warning" },
  py: { icon: FaPython, color: "text-success" },
  java: { icon: FaJava, color: "text-destructive" },
  html: { icon: FaHtml5, color: "text-destructive" },
  css: { icon: FaCss3Alt, color: "text-info" },
  json: { icon: SiJson, color: "text-warning" },
  md: { icon: FaMarkdown, color: "text-muted-foreground" },
  rs: { icon: SiRust, color: "text-foreground" },
  go: { icon: SiGo, color: "text-info" },
  gitignore: { icon: FaGitAlt, color: "text-destructive" },
};

export const FileIconComponent = ({ extension }: FileIconProps) => {
  const match = iconMap[extension];
  if (match) {
    const Icon = match.icon;
    return <Icon className={`text-sm flex-shrink-0 ${match.color}`} />;
  }
  return <VscFile className="text-sm flex-shrink-0 text-muted-foreground" />;
};
