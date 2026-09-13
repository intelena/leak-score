# @intelena/leak-score

Pure TypeScript pre-trade exposure scoring. See the [repository README](https://github.com/intelena/leak-score#readme) and [SPEC.md](https://github.com/intelena/leak-score/blob/main/SPEC.md).

```ts
import { scoreRoute } from "@intelena/leak-score";
scoreRoute({ sellAsset: "TSLA", buyAsset: "USDG", amount: 250, exposure: 70 }).leakScore; // 27
```
