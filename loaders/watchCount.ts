import { counter } from "site/sections/ItWorks.tsx";

export default function watchCount(_props: unknown) {
  return counter.watch();
}
