import { useData } from "./db";

/** Nilai kini tersimpan permanen di database; hook ini menjaga API lama tetap ringkas. */
export function useNilai() {
  const { nilai, simpanNilai, memuat, galat } = useData();
  return { nilai, simpan: simpanNilai, memuat, galat };
}
