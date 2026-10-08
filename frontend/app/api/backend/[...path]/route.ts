import { isChain, validIdentifier } from "@/lib/chains";
import { backendUrl } from "@/lib/backend";

const allowed =
  /^(?:health|api\/v1\/(?:addresses\/0x[0-9a-fA-F]{40}(?:\/transactions)?|transactions\/0x[0-9a-fA-F]{64}(?:\/(?:logs|fund-flow))?|investigations\/0x(?:[0-9a-fA-F]{40}|[0-9a-fA-F]{64})|blocks\/[0-9]+|indexer\/erc20\/[0-9]+\/[0-9]+))$/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const endpoint = path.join("/");
  const chain = path[3] ?? "";
  const isChainRoute =
    endpoint === "api/v1/chains" ||
    (path[0] === "api" &&
      path[1] === "v1" &&
      path[2] === "chains" &&
      isChain(chain) &&
      path[3] !== "ethereum" &&
      ((path.length === 5 && path[4] === "status") ||
        (path.length === 6 &&
          (path[4] === "address" || path[4] === "transaction") &&
          validIdentifier(chain, path[4], path[5]))));
  if (!allowed.test(endpoint) && !isChainRoute) {
    return Response.json({ message: "Unknown API endpoint." }, { status: 404 });
  }
  try {
    const upstream = await fetch(`${backendUrl()}/${endpoint}`, {
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(55000)]),
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      { message: "The data service could not be reached. Please try again." },
      { status: 503 },
    );
  }
}
