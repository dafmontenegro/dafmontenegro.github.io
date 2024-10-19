---
title: "How to Run Ollama on Google Colab"
description: "Ollama is a great tool for testing LLMs and Embedding models locally. It's possible to use this tool in Google Colab, but when you run ollama serve, your script will get stuck in that cell, and you won’t be able to run the following cells. Luckily, the solution is simple and can be done with code."
summary: "Ollama is a great tool for testing LLMs and Embedding models locally. It's possible to use this tool in Google Colab, but when you run ollama serve, your script will get stuck in that cell, and you won’t be able to run the following cells. Luckily, the solution is simple and can be done with code."
date: 2024-10-16
lastmod: 2024-10-16
featureAlt: "colab"
coverAlt: "colab"
thumbnailAlt: "colab"
categories: ["software"]
tags: ["google-colab", "ollama", "langchain"]
---
**Ollama** is a great tool for testing **LLMs** and **Embedding** models locally. It's possible to use this tool in **Google Colab**, but when you run `ollama serve`, **your script will get stuck** in that cell, and you won’t be able to run the following cells. Luckily, the solution is simple and can be done **with code**.

## Ollama Installation
For this, we simply go to the [Ollama downloads page](https://ollama.com/download/linux) and select **Linux**. The command is as follows

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

## Run 'ollama serve'
If you run `ollama serve`, you will encounter the issue where you cannot execute subsequent cells and **your script will remain stuck in that cell indefinitely**. To resolve this, you simply need to run the following command:

```bash
!nohup ollama serve > ollama_serve.log 2>&1 &
```

After running this command, **it is advisable** to wait a reasonable amount of time for it to execute before running the next command, so you can add something like:

```python
import time
time.sleep(3)
```

## Run 'ollama pull <model_name>'
Lastly, if you want to use a specific model, all you need to do is run an `ollama pull`, and it will be available for use via `ollama serve` in frameworks like **LangChain**.

```bash
!ollama pull phi3.5
```

If you are interested in a full implementation for a project, I invite you to have a look at my [gabo-rag project](https://github.com/dafmontenegro/gabo-rag).

{{< lead >}}
I've written other articles about Google Colab that you might find helpful. You can explore them all by browsing the articles under the [Google-Colab tag](/tags/google-colab/).
{{< /lead >}}