<div align="center">

# TacticGen: Grounding Adaptable and Scalable Generation of Football Tactics

<p>
  <a href="https://shengxu.net/">Sheng Xu</a><sup>1</sup>,
  <a href="https://guiliang.me/">Guiliang Liu</a><sup>1,&dagger;</sup>,
  <a href="https://tkharrat.info/">Tarak Kharrat</a><sup>2</sup>,
  <a href="https://miyunluo.com/">Yudong Luo</a><sup>1</sup>,
  <a href="https://www.linkedin.com/in/mohamed-aloulou/">Mohamed Aloulou</a><sup>2</sup>,
  <a href="https://www.linkedin.com/in/jlopezpena/">Javier Lopez Pena</a><sup>2</sup>,
  <br/>
  Konstantin Sofeikov<sup>2</sup>,
  <a href="https://www.linkedin.com/in/reidadam/">Adam Reid</a><sup>2</sup>,
  Paul Roberts<sup>2</sup>,
  <a href="https://www.linkedin.com/in/steven-spencer-00b20930/">Steven Spencer</a><sup>3</sup>,
  <a href="https://www.linkedin.com/in/joe-carnall-79478942/">Joe Carnall</a><sup>3</sup>,
  <br/>
  <a href="https://www.liverpool.ac.uk/people/ian-mchale">Ian McHale</a><sup>4</sup>,
  <a href="https://www.cs.sfu.ca/~oschulte/index.html">Oliver Schulte</a><sup>5</sup>,
  <a href="https://scholar.google.com/citations?user=n1DQMIsAAAAJ">Hongyuan Zha</a><sup>1</sup>,
  <a href="https://scholar.google.com/citations?user=AwqDDGoAAAAJ">Wei-Shi Zheng</a><sup>6</sup>
</p>

<p>
  <sup>1</sup> The Chinese University of Hong Kong, Shenzhen
  <br/>
  <sup>2</sup> Real Analytics
  <br/>
  <sup>3</sup> Birmingham City Football Club
  <br/>
  <sup>4</sup> University of Liverpool
  <br/>
  <sup>5</sup> Simon Fraser University
  <br/>
  <sup>6</sup> Sun Yat-sen University
</p>

<p><sup>&dagger;</sup> Corresponding author</p>

<p>
  <a href="https://arxiv.org/abs/2604.18210">[Paper]</a>
  <a href="https://arxiv.org/pdf/2604.18210">[PDF]</a>
  <a href="https://shengxu.net/TacticGen/">[Project Page]</a>
  <a href="LICENSE">[License]</a>
</p>

</div>

This repository is being prepared for a full open-source release. Currently, it hosts the project website and paper; code, pretrained models, dataset, and documentation will be released soon.

## Overview

![TacticGen motivation](website/static/images/tacticgen/TacticGen-motivation.png)

![TacticGen framework](website/static/images/tacticgen/TacticGen-framework.png)

TacticGen is a foundation-oriented model for football tactical generation. It is designed to be adaptable to various tactical objectives and scalable to large football datasets. Key features include:

- Reframes football analytics from trajectory prediction to controllable tactical generation.
- Jointly models the ball and all 22 players to capture cooperative and competitive interactions.
- Supports multiple guidances, including rule-based control, language-based prompting, and value-based guidance.
- Scales to large football datasets with 3.3M+ matches and 100M tracking frames.
- Shows strong realism and utility in expert-facing evaluations described in the paper.

## Release Status

The repository is being prepared for a broader public release. The current status is:

**Available now**

- [x] Paper
- [x] Project website source

**Coming soon**

- [ ] Training code
- [ ] Inference code
- [ ] Pretrained model checkpoints
- [ ] Dataset and access policy

## Dataset

TacticGen is built on a large-scale aligned football dataset comprising 1,432 matches, 3,374,599 annotated events, and 97,760,895 processed tracking frames collected from top-tier leagues between 2018 and 2025.

Due to privacy and data-sharing restrictions, the dataset is not publicly released at this time. If dataset access is important for your research or collaboration, please contact `shengxu1@link.cuhk.edu.cn`.

## Citation

If you find TacticGen useful in your research, please cite:

```bibtex
@article{xu2026tacticgen,
  title   = {TacticGen: Grounding Adaptable and Scalable Generation of Football Tactics},
  author  = {Xu, Sheng and Liu, Guiliang and Kharrat, Tarak and Luo, Yudong and Aloulou, Mohamed and Lopez Pena, Javier and Sofeikov, Konstantin and Reid, Adam and Roberts, Paul and Spencer, Steven and Carnall, Joe and McHale, Ian and Schulte, Oliver and Zha, Hongyuan and Zheng, Wei-Shi},
  journal = {arXiv preprint arXiv:2604.18210},
  year    = {2026},
  url     = {https://arxiv.org/abs/2604.18210}
}
```

## License

This repository is released under the Apache-2.0 License. Future public release artifacts may include additional usage notes or licenses where needed.
