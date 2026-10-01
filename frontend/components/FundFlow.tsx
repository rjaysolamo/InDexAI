import Link from "next/link";

import type {
  FundFlow as FundFlowData,
  FundFlowEdge,
  FundFlowNode,
} from "@/lib/api";
import { shortAddress } from "@/lib/format";

type Props = {
  flow: FundFlowData;
};

function groupEdges(edges: FundFlowEdge[]) {
  const groups = new Map<string, FundFlowEdge[]>();

  for (const edge of edges) {
    const key = `${edge.from}-${edge.to}`;
    const existing = groups.get(key) ?? [];
    existing.push(edge);
    groups.set(key, existing);
  }

  return Array.from(groups.values());
}

function AddressDisplay({
  address,
  nodes,
}: {
  address: string;
  nodes: FundFlowNode[];
}) {
  const node = nodes.find((item) => item.address === address);

  return (
    <Link href={`/address/${address}`} className="block hover:underline">
      {node?.label && (
        <p className="text-sm font-medium text-gray-900">{node.label}</p>
      )}
      <p className="font-mono text-xs text-gray-500">
        {shortAddress(address)}
      </p>
    </Link>
  );
}

export default function FundFlow({ flow }: Props) {
  const mainAddress = flow.transaction_from;
  const groups = groupEdges(flow.edges);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Fund flow</h2>
          <p className="mt-1 text-sm text-gray-500">
            {flow.edges.length} transfer
            {flow.edges.length === 1 ? "" : "s"} across {flow.nodes.length}{" "}
            address{flow.nodes.length === 1 ? "" : "es"}
          </p>
        </div>
      </div>

      <div className="rounded-md border border-gray-200 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
          Sender
        </p>
        <div className="mt-2">
          <AddressDisplay address={mainAddress} nodes={flow.nodes} />
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-md border border-gray-200 px-5 py-6 text-sm text-gray-500">
          No token transfers decoded for this transaction.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group, index) => {
            const first = group[0];
            const touchesMain =
              first.from.toLowerCase() === mainAddress.toLowerCase() ||
              first.to.toLowerCase() === mainAddress.toLowerCase();

            return (
              <div
                key={`${first.from}-${first.to}-${index}`}
                className={[
                  "rounded-md border bg-white p-4",
                  touchesMain ? "border-gray-300" : "border-gray-200",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <AddressDisplay address={first.from} nodes={flow.nodes} />
                  <span className="text-gray-300">→</span>
                  <AddressDisplay address={first.to} nodes={flow.nodes} />
                </div>

                <div className="mt-3 space-y-2">
                  {group.map((edge, edgeIndex) => {
                    const direction =
                      edge.from.toLowerCase() === mainAddress.toLowerCase()
                        ? "OUT"
                        : edge.to.toLowerCase() === mainAddress.toLowerCase()
                          ? "IN"
                          : "XFER";

                    return (
                      <div
                        key={`${edge.log_index}-${edgeIndex}`}
                        className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-2 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={[
                              "rounded px-1.5 py-0.5 text-[11px] font-semibold",
                              direction === "IN"
                                ? "bg-emerald-50 text-emerald-700"
                                : direction === "OUT"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-gray-100 text-gray-600",
                            ].join(" ")}
                          >
                            {direction}
                          </span>

                          <div>
                            <p className="font-medium">
                              {edge.human_amount} {edge.symbol}
                            </p>
                            {edge.token_address && (
                              <Link
                                href={`/address/${edge.token_address}`}
                                className="font-mono text-xs text-gray-500 hover:underline"
                              >
                                {shortAddress(edge.token_address)}
                              </Link>
                            )}
                          </div>
                        </div>

                        <span className="text-xs text-gray-400">
                          {edge.log_index === null
                            ? "Native"
                            : `Log #${edge.log_index}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
