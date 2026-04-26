import { Text as RNText, TextProps } from "react-native"
import { FONTS } from "../lib/fonts"

export function Text({ style, ...props }: TextProps) {
  const flat = Array.isArray(style) ? style : style ? [style] : []
  return <RNText style={[{ fontFamily: FONTS.regular }, ...flat]} {...props} />
}
