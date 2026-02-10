/**
 * 解析权限字符串 (例如 "rwxr-xr-x") 为数值对象
 * 返回: { owner: 7, group: 5, others: 5 }
 */
export const parsePermissionString = (permStr: string) => {
  // 忽略第一个字符 (通常是 d 或 -)
  const clean = permStr.length === 10 ? permStr.slice(1) : permStr;
  
  const calc = (chunk: string) => {
    let sum = 0;
    if (chunk[0] === 'r') sum += 4;
    if (chunk[1] === 'w') sum += 2;
    if (chunk[2] === 'x') sum += 1;
    return sum;
  };

  return {
    owner: calc(clean.slice(0, 3)),
    group: calc(clean.slice(3, 6)),
    others: calc(clean.slice(6, 9))
  };
};

/**
 * 将数值 (7, 5, 5) 转换为 Octal 字符串 "755"
 */
export const toOctalString = (owner: number, group: number, others: number) => {
  return `${owner}${group}${others}`;
};

/**
 * 检查特定的权限位是否存在
 * role: 0=owner, 1=group, 2=others
 * bit: 4=read, 2=write, 1=execute
 */
export const hasPerm = (octal: number, bit: number) => {
  return (octal & bit) === bit;
};