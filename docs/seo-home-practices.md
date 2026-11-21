# Práticas aplicadas na pagina inicial

## Conteúdo

- A pagina apresenta texto humano e original sobre a autora, nao uma pagina feita apenas para palavras-chave.
- O bloco principal usa uma descricao completa no HTML servido pelo Nuxt, em vez de depender de conteudo criado somente no cliente.
- O texto visual pode ser truncado em tres linhas, mas continua presente no DOM para leitores de tela e mecanismos de busca.
- O site nao usa uma contagem de palavras como requisito de ranqueamento. O Google declara que nao existe uma quantidade preferida de palavras.

## Metadados

- O titulo identifica a autora e seus temas principais.
- A meta description resume a pagina de forma unica e legivel.
- Open Graph recebe titulo e descricao consistentes para compartilhamentos.

## Divulgacao acessivel

- O controle usa um elemento real `<button>`.
- `aria-expanded` informa o estado aberto ou fechado.
- `aria-controls` associa o controle ao paragrafo controlado.
- O alvo do botao tem pelo menos 44 por 44 px.
- O botao funciona com teclado por meio dos comportamentos nativos de Enter e Space.
- Existe estado de foco visivel e suporte a movimento reduzido.

## Fontes oficiais

- Google Search Central: conteudo original e util, sem meta de contagem de palavras. https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google Search Central: boas praticas para meta descriptions e snippets. https://developers.google.com/search/docs/appearance/snippet
- Google Search Central: orientacao sobre SEO starter. https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- W3C ARIA APG: padrao Disclosure (Show/Hide). https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- W3C WCAG 2.2: tamanho minimo de alvo. https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
