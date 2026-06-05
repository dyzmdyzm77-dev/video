import VariantA from "./_variants/VariantA";

// 루트(/)는 기존 A안을 그대로 보여준다. UT용 A안 전용 경로는 /a.
export default function Page() {
  return <VariantA />;
}
