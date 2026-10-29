# Candidatura

Aplicação web para organizar o perfil profissional, revisar os requisitos de uma vaga e preparar materiais de candidatura.

## Executar localmente

Requer Node.js 18 ou superior. Não precisa instalar dependências.

```sh
node scripts/serve.cjs
```

Abra http://127.0.0.1:4173 no navegador.

## Recursos

- Perfil profissional com importação de texto e salvamento opcional no navegador.
- Cadastro da vaga, perguntas complementares e revisão dos materiais.
- Exemplo navegável com currículo, carta e mensagem editáveis.
- Cópia, download em texto e impressão para PDF.
- Layout responsivo e navegação por teclado.

## Estado do projeto

O fluxo de demonstração utiliza dados fictícios e conteúdo predefinido. A análise automática de currículos e a importação de vagas por link ainda não estão integradas. O link de referência incluído no formulário usa um resumo conferido da vaga, sem consulta automática.

Os dados pessoais permanecem na sessão, a menos que o usuário escolha salvar o perfil no navegador. A opção de limpeza remove os dados locais. Este repositório não contém credenciais ou dados de usuários.

## Estrutura

```text
dist/               Interface em HTML, CSS e JavaScript
scripts/serve.cjs   Servidor local para desenvolvimento
```
