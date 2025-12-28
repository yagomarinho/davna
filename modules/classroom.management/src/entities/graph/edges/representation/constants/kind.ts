/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export enum REPRESENTATION_KIND {
  TRANSFORMATION = 'transformation', // muda forma, preserva semântica
  ABSTRACTION = 'abstraction', // muda nível semântico
  ANALYSIS = 'analysis', // extrai atributos inferidos
  METADATA = 'metadata', // descreve o objeto, não o conteúdo
}
