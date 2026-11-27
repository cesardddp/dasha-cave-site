# Ícones

O projeto usa o componente `<Icon>` do Nuxt Icon. Os dois conjuntos instalados têm funções diferentes:

- `lucide` contém ícones de interface, como usuário, menu e lupa.
- `simple-icons` contém logos de marcas, como GitHub, Instagram e Amazon.

Use o prefixo do conjunto no nome do ícone:

```vue
<Icon name="lucide:user-round" aria-hidden="true" />
<Icon name="simple-icons:github" aria-hidden="true" />
```

Os dois conjuntos estão instalados como dependências de desenvolvimento:

- `@iconify-json/lucide`
- `@iconify-json/simple-icons`

Esses pacotes aumentam o tamanho de `node_modules` e os dados que o gerenciador de pacotes precisa baixar. Eles disponibilizam as coleções locais para o Nuxt Icon. Isso não é um purge: instalar uma coleção não garante que somente os ícones usados sejam incluídos nos artefatos de produção.

A instalação também não significa que todos os ícones serão enviados ao navegador. O tamanho do bundle depende de como o Nuxt Icon entrega os ícones e do build. Esta configuração do projeto não define opções específicas de bundle de ícones.

Antes de instalar outro conjunto, procure o ícone em `lucide` ou `simple-icons`. Consulte os nomes disponíveis em [Icônes](https://icones.js.org).
