---
title: "Gabo RAG"
description: "'Gabo' is a RAG (Retrieval-Augmented Generation) system designed to enhance the capabilities of LLMs (Large Language Models) such as 'Llama 3.2' or 'Phi 3.5'. This project honors Colombian author Gabriel García Márquez by marking the tenth anniversary of his death."
summary: "'Gabo' is a RAG (Retrieval-Augmented Generation) system designed to enhance the capabilities of LLMs (Large Language Models) such as 'Llama 3.2' or 'Phi 3.5'. This project honors Colombian author Gabriel García Márquez by marking the tenth anniversary of his death."
date: 2024-10-19
lastmod: 2024-10-19
featureAlt: "Gabriel García Márquez"
coverAlt: "Gabriel García Márquez"
coverCaption: "Gabriel García Márquez"
thumbnailAlt: "Gabriel García Márquez"
categories: ["software"]
tags: ["web-scraping", "nomic", "chinkig", "retriever", "rag", "gabriel-garcia-marquez", "llm", "langchain", "chromadb", "retrieval-augmented-generation", "ollama", "llama3-1", "llama3-2"]
---
# Gabo RAG
**'Gabo'** is a **RAG (Retrieval-Augmented Generation)** system designed to enhance the capabilities of **LLMs (Large Language Models)** such as **'Llama 3.2'** or **'Phi 3.5**'. This project honors Colombian author **Gabriel García Márquez** by marking the tenth anniversary of his death, creating a specialized assistant to answer questions about his work, and using new technologies to further reveal his literary legacy.

[**Python Notebook**](https://github.com/dafmontenegro/gabo-rag/blob/master/gabo_rag.ipynb) | [**Webpage**](https://montenegrodanielfelipe.com/projects/gabo-rag/) | [**Repository**](https://github.com/dafmontenegro/gabo-rag)

## 1. Tools and Technologies

- [**Ollama**](https://ollama.com/): Running models ([Llama 3.2](https://ollama.com/library/llama3.2) or [Phi 3.5](https://ollama.com/library/phi3.5)) and embeddings ([Nomic](https://ollama.com/library/nomic-embed-text))
- [**LangChain**](https://python.langchain.com/docs/introduction/): Framework and web scraping tool
- [**Chroma**](https://docs.trychroma.com/): Vector database

> A special thanks to ['Ciudad Seva (Casa digital del escritor Luis López Nieves)'](https://ciudadseva.com/quienes-somos/), from which the texts used in this project were extracted and where a comprehensive [Spanish Digital Library](https://ciudadseva.com/biblioteca/) is available.

## 2. How to run Ollama in Google Colab?

### 2.1 Ollama Installation
For this, we simply go to the [Ollama downloads page](https://ollama.com/download/linux) and select **Linux**. The command is as follows


```python
!curl -fsSL https://ollama.com/install.sh | sh
```

### 2.2 Run 'ollama serve'
If you run ollama serve, you will encounter the issue where you cannot execute subsequent cells and your script will remain stuck in that cell indefinitely. To resolve this, you simply need to run the following command:


```python
!nohup ollama serve > ollama_serve.log 2>&1 &
```

After running this command, it is advisable to wait a reasonable amount of time for it to execute before running the next command, so you can add something like:


```python
import time
time.sleep(3)
```

### 2.3 Run 'ollama pull <model_name>'
For this project we will use [Llama 3.2](https://ollama.com/library/llama3.2) the most recent release of **Meta** and specifically the **3B parameters** version. This project is also extensible to [Phi-3.5-mini](https://ollama.com/library/phi3.5) (the lightweight **Microsoft** model with high capabilities); you would only have to pull that other model.


```python
!ollama pull llama3.2
```

## 3. Exploring LLMs
Now that we have our LLM, it's time to test them with what will be our control question.


```python
test_message = "¿Cuántos hijos tiene la señora vieja del cuento Algo muy grave va a suceder en este pueblo?"
# EN:"How many children does the old woman in the story 'Something Very Serious Is Going to Happen in This Town' have?"
```

> 'Gabo' will be designed to function in Spanish, as it was Gabriel García Márquez's native language and his literary work is also in this language.

The information is found at the beginning of [the story,](https://ciudadseva.com/texto/algo-muy-grave-va-a-suceder-en-este-pueblo/) so we expect it to be something that can be answered if it has the necessary information.


```python
"""
ES
Fragmento inicial de 'Algo muy grave va a suceder en este pueblo' de Gabriel García Márquez.
"Imagínese usted un pueblo muy pequeño donde hay una señora vieja que tiene dos hijos, uno de 17 y una hija de 14... "

EN
Initial excerpt from 'Something Very Serious Is Going to Happen in This Town' by Gabriel García Márquez:
"Imagine a very small town where there is an old woman who has two children, a 17-year-old son and a 14-year-old daughter..."
"""
```

Before we can invoke the LLM, we need to install LangChain. [1]


```python
!pip install -qU langchain_community
```

and LangChain's support to Ollama


```python
!pip install -qU langchain-ollama
```

Now we create the model.


```python
from langchain_ollama import OllamaLLM

llm_llama = OllamaLLM(model="llama3.2")
```

Invoke Llama 3.2


```python
llm_llama.invoke(test_message)
```




    'No tengo información sobre un cuento llamado "Algo muy grave va a suceder en este pueblo" que incluya a una "señora vieja". Es posible que el cuento sea de autor desconocido o que no esté ampliamente conocido.\n\nSin embargo, puedo sugerirte algunas posibles opciones para encontrar la respuesta a tu pregunta:\n\n1. **Buscar en línea**: Puedes buscar el título del cuento en motores de búsqueda como Google para ver si se puede encontrar información sobre él.\n2. **Consultar una base de datos de literatura**: Si conoces el autor o la fecha de publicación del cuento, puedes consultar bases de datos de literatura en línea, como Goodreads o Literary Maps, para ver si se puede encontrar información sobre él.\n3. **Preguntar a un experto**: Si eres estudiante de literatura o tienes interés en el tema, puedes preguntar a un experto en la materia o buscar recursos educativos que puedan ayudarte a encontrar la respuesta a tu pregunta.\n\nSi tienes más información sobre el cuento, como el autor o la fecha de publicación, estaré encantado de ayudarte a encontrar la respuesta.'



> At this stage, the model is not expected to be able to answer the question correctly, and they might even hallucinate when trying to give an answer. To solve this problem, we will start building our **RAG** in the next section.

## 4. Data Extraction and Preparation
To collect the information that our **RAG** will use, we will perform **Web Scraping** of the section dedicated to [Gabriel Garcia Marquez](https://ciudadseva.com/autor/gabriel-garcia-marquez/) in the **Ciudad Seva web site**.

### 4.1 Web Scraping and Chunking
The first step is to install **Beautiful Soup** so that LangChain's **WebBaseLoader** works correctly.


```python
!pip install -qU beautifulsoup4
```

The next step will be to save the list of sources we will extract from the website into a variable.


```python
base_urls = ["https://ciudadseva.com/autor/gabriel-garcia-marquez/cuentos/",
             "https://ciudadseva.com/autor/gabriel-garcia-marquez/opiniones/",
             "https://ciudadseva.com/autor/gabriel-garcia-marquez/otrostextos/"]
```

Now we will create a function to collect all the links that lead to the texts. If we look at the HTML structure, we will notice that the information we're looking for is inside an `<article>` element with the class `status-publish`. Then, we simply extract the `href` attributes from the `<li>` elements inside the `<a>` tags.


```python
from langchain.document_loaders import WebBaseLoader

def get_urls(url):
    article = WebBaseLoader(url).scrape().find("article", "status-publish")
    lis = article.find_all("li", "text-center")
    return [li.find("a").get("href") for li in lis]
```

Let's see how many texts by the writer we can gather.


```python
gabo_urls = []

for base_url in base_urls:
    gabo_urls.extend(get_urls(base_url))

len(gabo_urls)
```




    51



Now that we have the URLs of the texts to feed our **RAG**, we just need to perform web scraping directly from the content of the stories. For that, we will build a function that follows a logic very similar to the previous function, which will initially give us the **raw text**, along with the **reference information** about what we are obtaining (the information found in `<header>`).


```python
def ciudad_seva_loader(url):
    article = WebBaseLoader(url).scrape().find("article", "status-publish")
    title = " ".join(article.find("header").get_text().split())
    article.find("header").decompose()
    texts = (" ".join(article.get_text().split())).split(". ")
    return [f"Fragmento {i+1}/{len(texts)} de '{title}': '{text}'" for i, text in enumerate(texts)]
```

There are indeed many ways to perform chunking, several of which are discussed in **"5 Levels of Text Splitting"** [2]. The most interesting idea for me about how to split texts, and what I believe fits best in this project, is **Semantic Splitting**. So, following that idea, we will ensure that the function divides all the texts by their periods, thus generating **semantic fragments in Spanish**.

> Tests were performed on the **Semantic Similarity** [3] offered by **Langchain**, but the results were worse. In this case, there is no need to do something extremely sophisticated, when the simplest and practically obvious solution is the best.

### 4.2 Embedding Model: Nomic
I ran several tests with different **embedding models**, including **LLama 3.1** and **Phi 3.5**, but it wasn't until I used `nomic-embed-text` that I saw significantly better results. So, this is the embedding model we'll use. Now let's pull with Ollama from [Nomic's embedding model](https://ollama.com/library/nomic-embed-text)


```python
!ollama pull nomic-embed-text
```

We're going to create our model so we can later use it in **Chroma**, our vector database.


```python
from langchain_ollama import OllamaEmbeddings

nomic_ollama_embeddings = OllamaEmbeddings(model="nomic-embed-text")
```

## 5. Storing in the Vector Database
**Chroma** is our chosen vector database. With the help of our embedding model provided by **Nomic**, we will store all the fragments generated from the texts, so that later we can query them and make them part of our context for each query to the **LLMs**.

### 5.1 Making Chroma Persistent
Here we have to think **one step ahead in time**, so we assume that chroma is already persistent, which means that it **exists in a directory**. If we don't do this, what will happen every time we run this **Python Notebook**, is that we will add repeated strings over and over again to the vector database. So it is a good practice to **reset Chroma** and in case it does not exist, it will be created and **simply remain empty**. [4]


```python
!pip install -qU chromadb langchain-chroma
```

We will create a function that will be specifically in charge of resetting the collection.


```python
from langchain_chroma import Chroma

def reset_collection(collection_name, persist_directory):
    Chroma(
        collection_name=collection_name,
		embedding_function=nomic_ollama_embeddings,
		persist_directory=persist_directory
	).delete_collection()

reset_collection("gabo_rag", "chroma")
```

### 5.2 Adding Documents to Chroma
We may think that it is enough to just pass it all the text and it will store it completely, but that approach is inefficient and contradictory to the idea of RAG; that is why a whole section was dedicated to Chunking before.


```python
count = 0

for gabo_url in gabo_urls:
    texts = ciudad_seva_loader(gabo_url)
    Chroma.from_texts(texts=texts, collection_name="gabo_rag", embedding=nomic_ollama_embeddings, persist_directory="chroma")
    count += len(texts)

count
```




    5908



Let's verify that all fragments were saved correctly in Chroma


```python
vector_store = Chroma(collection_name="gabo_rag", embedding_function=nomic_ollama_embeddings, persist_directory="chroma")

len(vector_store.get()["ids"])
```




    5908



> Here we are accessing the persistent data, not the in-memory data.

## 6. Use a Vectorstore as a Retriever
A retriever is an **interface** that specializes in retrieving information from an **unstructured query**. Let's test the work we did, we will use the same `test_message` as before and see if the retriever can return the **specific fragment** of the text that has the answer (the one quoted in section [3. Exploring LLMs](#3-exploring-llms)).


```python
retriever = vector_store.as_retriever(search_kwargs={"k": 1})

docs = retriever.invoke(test_message)

for doc in docs:
    title, article = doc.page_content.split("': '")
    print(f"\n{title}:\n{article}")
```

    
    Fragmento 2/40 de 'Algo muy grave va a suceder en este pueblo [Cuento - Texto completo.] Gabriel García Márquez:
    Imagínese usted un pueblo muy pequeño donde hay una señora vieja que tiene dos hijos, uno de 17 y una hija de 14'
    

By default `Chroma.as_retriever()` will search for the most similar documents and `search_kwargs={”k“: 1}` indicates that we want to limit the output to **1**. [4]

> We can see that the document returned to us was the **exact excerpt** that gives the **appropriate context** of our query. So the built retriever is **working correctly.**

## 7. RAG (Retrieval-Augmented Generation)
To better integrate our context to the query, we will make use of a **template** that will help us set up the behavior of the **RAG** and give it indications on how to answer.


```python
from langchain_core.prompts import PromptTemplate

template = """
Eres 'Gabo', un asistente especializado en la obra de Gabriel García Márquez. Fuiste creado en conmemoracion del decimo aniversario de su muerte.
Responde de manera concisa, precisa y relevante a la pregunta que se te ha hecho, sin desviarte del tema y limitando tu respuesta a un parrafo.
Cada consulta que recibas puede estar acompañada de un contexto que corresponde a fragmentos de cuentos, opiniones y otros textos del escritor.

Contexto: {context}

Pregunta: {input}

Respuesta:
"""

custom_rag_prompt = PromptTemplate.from_template(template)
```

**LangChain** tells us how to use `create_stuff_documents_chain()` to integrate **Llama 3.2** and our **custom prompt**. Then we just need to use `create_retrieval_chain()` to automatically pass to the **LLM** our input along with the context and fill it in the template. [5]


```python
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain

question_answer_chain = create_stuff_documents_chain(llm_llama, custom_rag_prompt)
rag_chain = create_retrieval_chain(retriever, question_answer_chain)
```

Now let's test with our first control question, which allows us to check if the **LLM** is aware of his or her **new identity.**


```python
response = rag_chain.invoke({"input": "Hablame de quien eres"})

print(f"\nANSWER: {response['answer']}\nCONTEXT: {response['context'][0].page_content}")
```

    
    ANSWER: Soy Gabo, un asistente especializado en la obra de Gabriel García Márquez. Fui creado en conmemoración del decimo aniversario de su muerte, como un homenaje a su legado literario y una forma de preservar su memoria para futuras generaciones. Mi nombre es una referencia a Gabriel García Márquez, pero también un apodo que me ha sido otorgado por aquellos que buscan información sobre su vida y obra.
    CONTEXT: Fragmento 62/179 de 'Diecisiete ingleses envenenados [Cuento - Texto completo.] Gabriel García Márquez': 'Un maletero hermoso y amable se echó el baúl al hombro y se hizo cargo de ella'
    

Finally let's conclude with the question that **started all this**....


```python
response = rag_chain.invoke({"input": test_message})

print(f"\nANSWER: {response['answer']}\nCONTEXT: {response['context'][0].page_content}")
```

    
    ANSWER: La señora vieja del cuento "Algo muy grave va a suceder en este pueblo" tiene dos hijos, un varón de 17 años y una hija de 14 años.
    CONTEXT: Fragmento 2/40 de 'Algo muy grave va a suceder en este pueblo [Cuento - Texto completo.] Gabriel García Márquez': 'Imagínese usted un pueblo muy pequeño donde hay una señora vieja que tiene dos hijos, uno de 17 y una hija de 14'
    

## 8. References
[1] **Ollama. (s. f.). ollama/docs/tutorials/langchainpy.md at main · ollama/ollama. GitHub.** https://github.com/ollama/ollama/blob/main/docs/tutorials/langchainpy.md

[2] **FullStackRetrieval-Com. (s. f.). RetrievalTutorials/tutorials/LevelsOfTextSplitting/5_Levels_Of_Text_Splitting.ipynb at main · FullStackRetrieval-com/RetrievalTutorials. GitHub.** https://github.com/FullStackRetrieval-com/RetrievalTutorials/blob/main/tutorials/LevelsOfTextSplitting/5_Levels_Of_Text_Splitting.ipynb

[3] **How to split text based on semantic similarity | 🦜️🔗 LangChain. (s. f.).** https://python.langchain.com/docs/how_to/semantic-chunker/

[4] **Chroma — 🦜🔗 LangChain  documentation. (s. f.).** https://python.langchain.com/v0.2/api_reference/chroma/vectorstores/langchain_chroma.vectorstores.Chroma.html

[5] **Build a Retrieval Augmented Generation (RAG) App | 🦜️🔗 LangChain. (s. f.).** https://python.langchain.com/docs/tutorials/rag/
