---
title: "How to Learn Machine Learning: A Roadmap Based on Reliable Sources"
description: "A machine learning roadmap for software engineers: essential mathematical foundations, free and recognized courses, practical projects, and common pitfalls."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/como-aprender-machine-learning.webp"
coverAlt: "Illustration of points from two classes separated by a curved decision boundary highlighted in yellow"
category: "Artificial Intelligence"
tags:
  - "Machine Learning"
  - "AI"
  - "Python"
  - "Career"
draft: false
lang: "en"
translationKey: "how-to-learn-machine-learning"
---

Anyone deciding to learn machine learning today faces the exact opposite challenge of a decade ago: there is no shortage of material; there is an overwhelming surplus. Thousands of courses, video lectures, and "definitive roadmaps" flood the internet, many superficial or outdated. The most frequent outcome is spending months consuming passive tutorials without building the capability to solve a real-world engineering problem.

This article outlines the roadmap I would follow as a software engineer, assembled exclusively from recognized, predominantly free primary sources: Andrew Ng's curriculum, fast.ai, Google's Machine Learning Crash Course, Andrej Karpathy's lectures, and Google's *Rules of Machine Learning*.

## Before Beginning: Define Your Core Objective

"Learning ML" encompasses vastly different technical trajectories:

| Objective | Prerequisites | Mathematical Depth Required |
| :--- | :--- | :--- |
| **Consuming off-the-shelf models** (LLM APIs, pre-trained weights) | Software engineering, evaluation harnesses, vector embedding basics | Low |
| **Training and deploying models to production** | Classical ML, deep learning, data pipelines, MLOps | Medium |
| **Original research** | All of the above, plus advanced mathematics and reading academic literature | High |

This roadmap directly targets the second objective: where most engineers aiming to "learn ML for real" reside. If your focus is purely the first category, my guide on [how to use AI productively](/en/blog/how-to-use-ai-productively) is a better starting point.

## What Machine Learning Is, in a Single Sentence

Instead of hand-crafting explicit imperative rules ("if email body contains X, flag as spam"), you supply historical examples to an optimization algorithm, which parameterizes a statistical model that generalizes to unseen data. Deep learning is the subset utilizing multi-layered artificial neural networks. Large language models (LLMs) are deep learning architectures trained on massive text corpora.

## Two Paradigms: Bottom-Up vs. Top-Down

Educational pedagogy in ML generally divides into two philosophies, both offering exceptional foundational curricula:

- **Bottom-Up:** Foundations and mathematical theory first, empirical application second. This is epitomized by Andrew Ng's Machine Learning Specialization.
- **Top-Down:** Deploying a functioning end-to-end model in lesson one, progressively peeling back underlying mechanical layers as needed. This is the explicit philosophy of fast.ai, which teaches entirely through concrete code examples.

My recommendation is to combine both: take a foundational course to acquire conceptual vocabulary and theoretical intuition, alongside a hands-on applied track to build working models early and sustain momentum.

## Stage 0: Python and the Data Ecosystem

If you already program professionally in another language, Python syntax is straightforward to acquire. The essential libraries to master:

- **NumPy:** N-dimensional array manipulation and vectorized linear algebra.
- **pandas:** Tabular data wrangling, cleaning, and transformation.
- **Matplotlib** (or Seaborn): Exploratory data visualization.
- **Jupyter:** Interactive notebook environments for rapid data exploration.
- **scikit-learn:** The industry-standard reference library for classical machine learning algorithms.

## Stage 1: The Mathematics That Actually Matters

You do not need an undergraduate mathematics degree to begin, but three disciplines appear continuously:

- **Linear Algebra:** Vectors, matrices, dot products, matrix multiplication, rank, and projections.
- **Calculus:** Partial derivatives, gradients, and the chain rule (the mathematical engine of gradient descent and backpropagation).
- **Probability and Statistics:** Probability distributions, expectation, variance, conditional probability, Bayes' theorem, and statistical inference.

Two exceptional free resources:

- **[Mathematics for Machine Learning](https://mml-book.github.io/)**, by Deisenroth, Faisal, and Ong: A comprehensive textbook available freely as a PDF.
- **[3Blue1Brown's Neural Networks Series](https://www.3blue1brown.com/topics/neural-networks)**: World-class visual animations providing geometric intuition for gradients and backpropagation.

An effective learning strategy: acquire mathematical tools just-in-time as they emerge in coursework, rather than attempting to exhaustively master university-level math before writing a line of code.

## Stage 2: Classical Machine Learning

Here reside the foundational principles you will rely on for the rest of your engineering career, even when operating advanced deep learning architectures:

- Supervised learning (regression and classification) vs. unsupervised learning (clustering, dimensionality reduction);
- Partitioning datasets into distinct training, validation, and test splits;
- Overfitting vs. underfitting, bias-variance tradeoff, and regularization techniques;
- Evaluation metrics: accuracy, precision, recall, F1 score, ROC-AUC, mean squared error (MSE);
- K-fold cross-validation;
- Feature engineering, imputing missing values, and categorical encoding.

Recommended curricula:

- **[Machine Learning Specialization](https://www.coursera.org/specializations/machine-learning-introduction)** (DeepLearning.AI and Stanford Online, taught by Andrew Ng): Three comprehensive courses with Python coding labs implementing algorithms with NumPy and scikit-learn.
- **[Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course)** (Google): Video modules, interactive visualizations, and coding exercises spanning linear models through neural networks, embeddings, and foundational LLM concepts.

A complete end-to-end classification pipeline utilizing scikit-learn on a built-in dataset:

```python
from sklearn.datasets import load_breast_cancer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

X, y = load_breast_cancer(return_X_y=True)

# Separate a hold-out test set only evaluated at the very end.
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# The pipeline guarantees data scaling is learned strictly from training data.
model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))

scores = cross_val_score(model, X_train, y_train, cv=5, scoring="f1")
print(f"Cross-validation F1: {scores.mean():.3f} ± {scores.std():.3f}")

model.fit(X_train, y_train)
print(classification_report(y_test, model.predict(X_test)))
```

Note two critical architectural hygiene practices avoiding classic errors: the test split is completely isolated prior to any analytical decisions, and data pre-processing is encapsulated inside a reproducible `Pipeline` object to strictly eliminate information leakage (data leakage) from test folds into training steps.

## Stage 3: Deep Learning

Once classical ML foundations are solidified, deep learning architectures become substantially more approachable:

- **[Practical Deep Learning for Coders](https://course.fast.ai/)** (fast.ai): Free, top-down curriculum. As their team notes, the only prerequisite is programming proficiency (roughly one year of coding experience, ideally Python) and high-school mathematics.
- **[Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html)** (Andrej Karpathy): Builds micrograd from scratch, progressing through multi-layer perceptrons, convolutions, and up to a functioning GPT-style Transformer. Essential for understanding internal mechanics without abstraction magic.
- **[Dive into Deep Learning](https://d2l.ai/)**: An outstanding free interactive textbook featuring runnable code implementations across modern deep learning libraries.

Both fast.ai and Karpathy's series standardize on PyTorch, making it the premier framework choice for new practitioners.

## Stage 4: Projects with Real-World Dirty Data

Coursework without standalone projects does not build lasting competence. High-leverage avenues for empirical practice:

- **[Kaggle](https://www.kaggle.com/learn)**: Short practical modules, diverse open datasets, and active competitions with open-source notebooks published by high-ranking participants.
- **Domain datasets from your workplace or locality:** Solving a messy operational challenge you personally understand delivers infinitely greater engineering skill than training another generic toy dataset classifier.

When executing an ML project, Andrej Karpathy's guide *A Recipe for Training Neural Networks* (2019) is required reading. He reminds practitioners that neural network training is a leaky abstraction that fails silently: a broken, misconfigured model will frequently still train without throwing exceptions, simply yielding subpar performance. His recipe mandates **becoming intimately familiar with raw data first**, establishing an end-to-end training and evaluation skeleton with simple baselines, and only then progressing to intentional overfitting, regularization, and hyperparameter tuning.

## Stage 5: Machine Learning in Production (MLOps)

Operating a model in production environments is primarily an engineering problem. Martin Zinkevich's *Rules of Machine Learning* (Google) highlights this reality directly in its introduction: most of the problems you will face are, in fact, engineering problems. The opening heuristics from the document serve as an invaluable operational filter:

1. Do not be afraid to launch a product without machine learning.
2. First, design and implement metrics.
3. Choose machine learning over a complex hand-crafted heuristic.
4. Keep your first model simple and get the surrounding infrastructure right.

In production engineering, this translates into versioning data schemas alongside model artifacts, instrumenting drift monitoring on live inferences (as real-world distributions shift and models decay), establishing automated rollback gates, and continuously benchmarking live inference quality against simple heuristic baselines.

## Common Pitfalls

- **Tutorial paralysis:** Consuming course after course without ever framing and solving an independent engineering problem.
- **Skipping exploratory data analysis:** Jumping straight into model architecture without inspecting feature distributions, missing value mechanics, and mislabeled classes.
- **Data leakage:** Inadvertently allowing validation or test split information to influence feature transformations or model training parameters.
- **Relying on raw accuracy with imbalanced datasets:** A fraudulent transaction detector that predicts "not fraud" 100% of the time can achieve 99.9% accuracy while being completely useless.
- **Chasing bleeding-edge state of the art:** A properly calibrated logistic regression or gradient-boosted tree (XGBoost/LightGBM) solves an immense proportion of enterprise requirements far more reliably.
- **Omitting baseline benchmarks:** Without comparing model performance against a naive heuristic or linear baseline, it is impossible to verify whether architectural complexity adds genuine business value.

## Suggested Learning Roadmap

A pragmatic study sequence assuming an investment of several hours per week. Pacing is indicative and adapts to prior background:

| Phase | Technical Focus | Core Curriculum |
| :--- | :--- | :--- |
| **1** | Python, NumPy, and pandas | Official documentation and Kaggle Learn |
| **2** | Classical ML foundations | Machine Learning Specialization or Google ML Crash Course |
| **3** | First complete applied project | Real-world dataset, robust baseline, honest evaluation metrics |
| **4** | Deep learning architectures | fast.ai and Karpathy's Zero to Hero |
| **5** | Second project (Deep Learning) | Apply Karpathy's Training Recipe end-to-end |
| **6** | Production MLOps | Google's Rules of ML; deploy a monitored model with rollback capabilities |

## References

This article is a structured technical roadmap based on the recognized primary sources below. Sections marked as opinion reflect my own analysis.

- DeepLearning.AI and Stanford Online. [Machine Learning Specialization](https://www.coursera.org/specializations/machine-learning-introduction).
- Google. [Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course).
- fast.ai. [Practical Deep Learning for Coders](https://course.fast.ai/).
- Andrej Karpathy. [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html).
- Andrej Karpathy. [A Recipe for Training Neural Networks](https://karpathy.github.io/2019/04/25/recipe/) (April 2019).
- Martin Zinkevich, Google. [Rules of Machine Learning: Best Practices for ML Engineering](https://developers.google.com/machine-learning/guides/rules-of-ml).
- Marc Peter Deisenroth, A. Aldo Faisal, and Cheng Soon Ong. [Mathematics for Machine Learning](https://mml-book.github.io/). Cambridge University Press, 2020.
- Aston Zhang et al. [Dive into Deep Learning](https://d2l.ai/).
- scikit-learn. [User Guide](https://scikit-learn.org/stable/user_guide.html).
