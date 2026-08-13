# ACC Ordo PM — Evolução v4 para GitHub Pages

Esta é a versão estática do ACC Ordo PM preparada para ser publicada no
GitHub Pages. O processo de publicação está automatizado pelo arquivo
`.github/workflows/deploy-pages.yml`.

## Publicar pela primeira vez

1. Crie um repositório no GitHub. Para permitir acesso a qualquer pessoa pelo
   link, use um repositório público ou confirme que o seu plano permite Pages
   público a partir de repositório privado.
2. Envie **o conteúdo desta pasta** para a raiz do repositório. O arquivo
   `package.json` deve aparecer na página inicial do repositório.
3. No repositório, abra **Settings > Pages**.
4. Em **Build and deployment > Source**, escolha **GitHub Actions**.
5. Abra **Actions**, selecione **Publicar no GitHub Pages** e clique em
   **Run workflow**. Um novo envio para a branch `main` também publica o site.

Quando a execução terminar, o endereço será semelhante a:

```text
https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/
```

## Enviar pelo terminal

Na pasta extraída, execute:

```bash
git init
git add .
git commit -m "Publica ACC Ordo PM v4"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
git push -u origin main
```

## Executar no computador

Requer Node.js 22.13 ou superior:

```bash
npm ci
npm run dev
```

Abra o endereço indicado no terminal.

## Atualizar o site

Depois de alterar os arquivos, envie a mudança para a branch `main`:

```bash
git add .
git commit -m "Atualiza o ACC Ordo PM"
git push
```

O GitHub Pages fará uma nova publicação automaticamente.

## Onde editar

- `src/App.tsx`: conteúdo e funcionalidades.
- `src/styles.css`: aparência e responsividade.
- `index.html`: título, ícone e metadados.

## Dados e privacidade

Os dados são guardados pelo `localStorage` no navegador. Isso significa:

- cada navegador ou dispositivo possui sua própria cópia;
- os dados não são compartilhados entre usuários;
- limpar os dados do navegador apaga os registros locais;
- os dados do endereço antigo não migram automaticamente para o GitHub Pages.

O projeto não envia os dados cadastrados para um servidor.
