// react-native-svg está fixado em 15.12.1. A entrada nativa importa somente
// as primitivas utilizadas: o barrel público também carrega parsers XML/CSS e
// filtros que o jogo não usa. Rever estes caminhos ao atualizar a dependência.
export { default } from 'react-native-svg/src/elements/Svg';
export { default as Circle } from 'react-native-svg/src/elements/Circle';
export { default as Ellipse } from 'react-native-svg/src/elements/Ellipse';
export { default as G } from 'react-native-svg/src/elements/G';
export { default as Path } from 'react-native-svg/src/elements/Path';
export { default as Polygon } from 'react-native-svg/src/elements/Polygon';
export { default as Rect } from 'react-native-svg/src/elements/Rect';

export { default as Defs } from 'react-native-svg/src/elements/Defs';
export { default as LinearGradient } from 'react-native-svg/src/elements/LinearGradient';
export { default as Stop } from 'react-native-svg/src/elements/Stop';
