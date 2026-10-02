import { Children, cloneElement, isValidElement, type HTMLAttributes, type ReactNode } from 'react';
import { formatAvatarText } from '../lib/avatarTypography';

// Transform rendered children, including conditional hints, without mutating props.
function formatChildren(children: ReactNode): ReactNode {
  return Children.map(children, child => {
    if (typeof child === 'string') return formatAvatarText(child);
    if (isValidElement<{ children?: ReactNode }>(child) && child.props.children !== undefined) {
      return cloneElement(child, { children: formatChildren(child.props.children) });
    }
    return child;
  });
}

/** Shared display boundary for avatar speech; surrounding lesson copy stays untouched. */
export default function AvatarBubble({ children, style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} data-avatar-bubble style={{
      ...style,
      minWidth: 0,
      maxWidth: '100%',
      whiteSpace: 'normal',
      overflowWrap: 'anywhere',
      wordBreak: 'normal',
    }}>
      {formatChildren(children)}
    </div>
  );
}
