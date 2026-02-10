// 容器动画：控制子元素的错峰出现
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // 每个子元素间隔 0.05秒 出现，产生波浪感
      delayChildren: 0.1     // 稍微延迟一点点再开始
    }
  }
};

// 子元素动画：从下往上飘入 + 淡入
export const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20, // 初始位置在下方 20px
    scale: 0.95 // 稍微缩小一点
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring", // 使用弹簧物理效果，比 linear 更有质感
      stiffness: 100,
      damping: 15,
      mass: 1
    }
  }
};