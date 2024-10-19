---
title: "How to download a folder from Google Colab"
description: "Google Colab's UI from its file browser allows you to download files individually, but does not have an option to download entire directories; the solution is simple and can be done with code."
summary: "Google Colab's UI from its file browser allows you to download files individually, but does not have an option to download entire directories; the solution is simple and can be done with code."
date: 2024-10-14
lastmod: 2024-10-14
featureAlt: "colab"
coverAlt: "colab"
thumbnailAlt: "colab"
categories: ["software"]
tags: ["google-colab"]
---
**Google Colab's UI** from its file browser allows you to download **files individually**, but does not have an option to download **entire directories**; the solution is simple and can be done **with code**.

I encountered this problem while using **Google Colab** to develop my [gabo-rag project](https://github.com/dafmontenegro/gabo-rag), basically my idea was to connect to a **GPU environment** to create the **Vector Database** and then use it persistently for testing.

After waiting a while for my code to finish executing, I tried to download the resulting directory, but I couldn't find **a simple solution quickly**. This is the solution I ended up using.

## Download a File

Downloading a file using code is **very easy**, we only need to use:

```python
google.colab import files

files.download("data.csv")
```

However, this has a problem, `files.download()` only works for files, **it is not possible** to download a folder in this way.

## Compress a Folder into a File

Sometimes the simplest or most obvious solutions are the most effective, in this case all we need is to **convert our directory** into a **single compressed file**.

```python
import shutil

shutil.make_archive("dir_to_compress", "zip", "name_zip")
```

## Download a Folder

Now you only have to use `files.download()` to download the compressed file we generated in the **previous section**.

```python
google.colab import files

files.download("name_zip.zip")
```

Finally you just have to **unzip the file locally** on your computer. If you need the complete code it is here:

```python
google.colab import files
import shutil

shutil.make_archive("dir_to_compress", "zip", "name_zip")
files.download("name_zip.zip")
```

{{< lead >}}
I've written other articles about Google Colab that you might find helpful. You can explore them all by browsing the articles under the [Google-Colab tag](/tags/google-colab/).
{{< /lead >}}