export function convertToEncoded(rawValue: string): string {
  return rawValue
    .replace(/C\+\+/g, 'Cpp') // Replace 'C++' with 'Cpp'
    .replace(/c\+\+/g, 'cpp') // Replace 'c++' with 'cpp'
    .replace(/C#/g, 'CSharp') // Replace 'C#' with 'CSharp'
    .replace(/c#/g, 'csharp')
    .replace(/[^a-zA-Z0-9가-힣\s\-._~]/g, '')
    .replace(/\s+/g, '+');
}
