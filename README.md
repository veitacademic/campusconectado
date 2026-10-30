# Campus Conectado

## Documentação técnica

Aplicativo mobile para organizar trabalhos, entregas e prazos da faculdade. O projeto usa React Native com Expo SDK 54 e salva as informações localmente no aparelho.

## Requisitos funcionais

- ** Cadastrar atividade:** permitir informar título, disciplina, descrição e prazo de entrega.
- ** Validar dados:** exigir o preenchimento dos campos e aceitar apenas datas válidas no formato `DD/MM/AAAA`.
- ** Consultar atividades:** exibir as atividades cadastradas, ordenadas pelo prazo.
- ** Filtrar atividades:** permitir visualizar todas, apenas as pendentes ou apenas as concluídas.
- ** Alterar situação:** permitir marcar uma atividade como concluída ou pendente.
- ** Editar atividade:** permitir alterar os dados de uma atividade já cadastrada.
- ** Excluir atividade:** permitir excluir uma atividade após confirmação.
- ** Salvar dados:** manter atividades e alterações armazenadas no aparelho, inclusive após fechar e abrir o app novamente.

## Tecnologias

- JavaScript
- React 19.1.0
- React Native 0.81.5
- Expo SDK 54
- AsyncStorage

## Requisitos para executar o projeto

- Windows 10 ou superior, 64 bits.
- Node.js LTS instalado.
- Android Studio instalado.
- Emulador Android configurado no Android Studio, ou celular Android com Expo Go compatível com o SDK 54.
- Conexão com a internet para instalar dependências e ferramentas.

## Instalar o Android Studio e configurar o emulador

1. Baixe o Android Studio pelo [site oficial](https://developer.android.com/studio).
2. Execute o instalador `.exe` e siga as instruções.
3. Na primeira abertura, conclua o assistente de configuração e instale os pacotes de SDK recomendados. Veja o [guia oficial de instalação](https://developer.android.com/studio/install).
4. Na tela inicial do Android Studio, acesse **More Actions > Virtual Device Manager**.
5. Selecione **Create Virtual Device**, escolha um aparelho — por exemplo, um modelo Pixel — e clique em **Next**.
6. Escolha uma imagem do Android. Se necessário, faça o download solicitado e conclua em **Finish**.
7. No **Device Manager**, clique no botão ▶ para iniciar o emulador. Consulte também o [guia do Expo para emuladores Android](https://docs.expo.dev/workflow/android-studio-emulator/).

## Instalar e iniciar o Campus Conectado

O Android Studio é usado para iniciar o emulador. O Expo é usado para iniciar o projeto e carregar o app nele.

1. Extraia os arquivos do projeto.
2. No Android Studio, abra a pasta principal do projeto — aquela que contém `package.json`.
3. Abra o terminal do Android Studio em **View > Tool Windows > Terminal**. Também é possível usar o CMD ou PowerShell nessa pasta.
4. Instale as dependências:

   ```bash
   npm install
   ```

5. Com o emulador já iniciado, inicie o Expo:

   ```bash
   npx expo start
   ```

   O comando correto é `npx expo start` — não `npx expo star`.

6. Quando o servidor do Expo estiver pronto, pressione **a** no terminal para abrir o app no emulador Android. O Expo CLI também pode ser iniciado pelo terminal; consulte a [documentação oficial do Expo CLI](https://docs.expo.dev/more/expo-cli/).

Para testar em um celular, conecte o computador e o aparelho à mesma rede Wi-Fi e leia o QR code exibido no terminal usando uma versão do Expo Go compatível com SDK 54. Se necessário, consulte [expo.dev/go](https://expo.dev/go).

Para encerrar o servidor, volte ao terminal e pressione **Ctrl+C**.