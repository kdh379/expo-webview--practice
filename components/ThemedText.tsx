import { Text, TextProps } from 'react-native';

type ThemedTextProps = TextProps & {
  type?: 'title' | 'body' | 'link';
};

export const ThemedText = ({ type = 'body', style, ...props }: ThemedTextProps) => {
  const textStyle = {
    title: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    body: {
      fontSize: 16,
    },
    link: {
      fontSize: 16,
      color: '#0066CC',
      textDecorationLine: 'underline',
    },
  };

  return <Text style={[textStyle[type], style]} {...props} />;
};