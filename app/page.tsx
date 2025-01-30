"use client"

import { AstraStream, GetAstraStreams, ToggleAstraStream } from "@/ssr/astra";
import { CheckUpdates, CheckUpdatesResponse, PerformUpdate } from "@/ssr/update";
import { cn } from "@/utils/cn";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify";

export default function HomePage() {
	const [view, setView] = useState<'list' | 'grid'>('list');
	const [streams, setStreams] = useState<AstraStream[] | null>(null);
	const [lastFetched, setLastFetched] = useState<number>(0);
	const [checkUpdateResponse, setCheckUpdateResponse] = useState<CheckUpdatesResponse | null>(null);
	const [isUpdating, setIsUpdating] = useState<boolean>(false);

	const fetchConfig = useCallback(async () => {
		setStreams(await GetAstraStreams());
		setLastFetched(Date.now());
	}, []);

	const checkUpdate = useCallback(async () => {
		setCheckUpdateResponse(await CheckUpdates());
	}, []);

	const doUpdate = useCallback(async () => {
		setIsUpdating(true);
		await PerformUpdate();
		// @ts-ignore
		window.location.reload();
	}, []);

	useEffect(() => {
		fetchConfig();
		checkUpdate();
		const ivalConfig = setInterval(() => fetchConfig(), 2500);
		const ivalUpdates = setInterval(() => checkUpdate(), 10000);
		return () => {
			clearInterval(ivalConfig);
			clearInterval(ivalUpdates);
		}
	}, []);

	const disableEnableStream = useCallback(async (id: string) => {
		const streamFilter = (streams || []).filter(item => item.id === id);
		if(streamFilter.length === 0) return;
		if(streamFilter[0].enable && !window.confirm(`Are you sure you want to disable "${streamFilter[0].name}"?`)) return;
		await ToggleAstraStream(id);
		toast(`Stream ${streamFilter[0].name} has been ${streamFilter[0].enable ? 'disabled' : 'enabled'}`);
		await fetchConfig();
	}, [streams]);

	const amountErrors = useMemo(() => (streams || [])
		.filter(item => item.stats && (item.stats.cc_error !== 0 || item.stats.pes_error !== 0 || item.stats.sc_error !== 0 || item.stats.sync_error !== 0 || item.stats.audio_count === 0 || item.stats.video_count === 0)).length, [streams])

	const amountWarnings = useMemo(() => (streams || [])
		.filter(item => item.stats && item.stats.bitrate > 200 && item.stats.bitrate < 600).length, [streams]);

	const enabledAmount = useMemo(() => (streams || []).filter(item => item.enable).length, [streams]);

	return (
		<>
			{isUpdating && (
				<div className={`fixed top-0 left-0 bottom-0 right-0 bg-black bg-opacity-50 flex items-center justify-center`}>
					<div className={`bg-white p-8 rounded-lg`}>
						<p className={`font-bold text-xl`}>Updating software</p>
						<p className={`mt-2`}>This window will refresh automatically.</p>
					</div>
				</div>
			)}
			{streams === null && (
				<div>
					<p>Loading...</p>
				</div>
			)}
			<div className={`flex mt-8 ml-8 mr-8 items-center`}>
				<button className={`bg-gray-500 text-white text-sm rounded px-2 py-1`} onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>View as {view === 'list' ? 'grid' : 'list'}</button>
				{checkUpdateResponse?.update_available && (
					<button className={`bg-blue-500 text-white text-sm rounded px-2 py-1 ml-4`} onClick={doUpdate}>New update available</button>
				)}
				<div className={`ml-auto flex items-center space-x-8 text-sm`}>
					{amountWarnings !== 0 && (
						<p className={`text-orange-700 font-medium`}>{amountWarnings} bitrate warning{amountWarnings === 1 ? '' : 's'}</p>
					)}
					{amountErrors !== 0 && (
						<p className={`text-red-700 font-medium`}>{amountErrors} error{amountErrors === 1 ? '' : 's'}</p>
					)}
					<p className={`bg-gray-300 py-1 px-2 rounded`}>{enabledAmount} / {(streams || []).length} enabled</p>
					<p>Last refreshed: {format(new Date(lastFetched), 'HH:mm:ss')}</p>
				</div>
			</div>
			{view === 'grid' ? (
				<div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-8`}>
					{(streams || []).sort((a, b) => a.name < b.name ? -1 : 1).map((stream, key) => (
						<div className={`border p-4 flex flex-col`} key={key}>
							<div className={`flex items-center`}>
								<p className={`font-medium flex-grow text-xl`}>{stream.name}</p>
								<button className={cn(
									`bg-gray-200 px-2 py-1 text-sm rounded transition-colors`,
									stream.enable ? 'hover:bg-red-500' : 'hover:bg-green-500'
								)} onClick={() => disableEnableStream(stream.id)}>{stream.enable ? 'Disable' : 'Enable'}</button>
							</div>
							{!stream.enable && (
								<>
									<div className={`flex-grow flex items-center justify-center`}>
										<p className={`text-sm italic`}>This channel is disabled</p>
									</div>
									<button onClick={() => disableEnableStream(stream.id)} className={`bg-gray-300 hover:bg-green-700 hover:text-white transition-colors rounded text-sm flex items-center justify-center h-8 w-full`}>
										<p>Enable channel</p>
									</button>
								</>
							)}
							{stream.stats && (
								<div className={`flex flex-col mt-4`}>
									<div className={`text-xs grid grid-cols-4 text-center`}>
										<p className={cn('py-2 rounded', stream.stats.pes_error !== 0 && 'bg-red-500')}>PES: {stream.stats.pes_error}</p>
										<p className={cn('py-2 rounded', stream.stats.cc_error !== 0 && 'bg-red-500')}>CC: {stream.stats.cc_error}</p>
										<p className={cn('py-2 rounded', stream.stats.sc_error !== 0 && 'bg-red-500')}>SC: {stream.stats.sc_error}</p>
										<p className={cn('py-2 rounded', stream.stats.sync_error !== 0 && 'bg-red-500')}>SYNC: {stream.stats.sync_error}</p>
									</div>
									<div className={`text-xs grid grid-cols-3 text-center mt-4`}>
										<p>Audio: {stream.stats.audio_count}</p>
										<p>Video: {stream.stats.video_count}</p>
										<p>Sessions: {stream.stats.sessions}</p>
									</div>
									<div className={`flex items-center space-x-4 justify-center mt-6`}>
										{stream.output && (
											<p className={`text-xs`}>Multicast: <span className={`bg-gray-200 py-1 px-2 rounded font-medium`}>{stream.output}</span></p>
										)}
										<p className={`text-xs`}>PNR: <span className={`bg-gray-200 py-1 px-2 rounded font-medium`}>{stream.id}</span></p>
									</div>
									<div className={cn(
										`mt-4 w-full h-8 bg-gray-100 text-sm font-medium flex items-center justify-center rounded`,
										stream.stats.bitrate < 200 ? 'bg-red-500' : (
											stream.stats.bitrate < 600 ? 'bg-yellow-500' : 'bg-green-500'
										)
									)}>
										<p>{stream.stats.bitrate} Kbit/s</p>
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			) : (
				<div className={`p-8`}>
					<table className={`w-full`}>
						<thead>
							<tr className={`font-medium`}>
								<td className={`py-2 pl-4`}>Name</td>
								<td>Status</td>
								<td>PES</td>
								<td>CC</td>
								<td>SC</td>
								<td>SYNC</td>
								<td>Audio</td>
								<td>Video</td>
								<td>Sessions</td>
								<td>PNR</td>
								<td>Multicast</td>
								<td>Bitrate</td>
							</tr>
						</thead>
						<tbody>
							{(streams || []).sort((a, b) => a.name < b.name ? -1 : 1).map((stream, key) => (
								<tr key={key} className={cn(
									key % 2 === 1 && 'bg-gray-200'
								)}>
									<td className={`py-2 pl-4 font-medium`}>{stream.name}</td>
									<td>
										<button
											className={cn(
												`bg-gray-300 px-2 py-1 text-sm rounded transition-colors`,
												stream.enable ? 'bg-green-700 text-white hover:bg-red-700' : 'bg-red-700 text-white hover:bg-green-700'
											)}
											onClick={() => disableEnableStream(stream.id)}
										>
											{stream.enable ? 'Enabled' : 'Disabled'}
										</button>
									</td>
									{stream.stats ? (
										<>
											<td>
												<div className={`flex`}>
													<div className={cn(
														`py-1 px-2 rounded text-sm`,
														stream.stats.pes_error !== 0 && 'bg-red-500'
													)}>
														{stream.stats.pes_error}
													</div>
												</div>
											</td>
											<td>
												<div className={`flex`}>
													<div className={cn(
														`py-1 px-2 rounded text-sm`,
														stream.stats.cc_error !== 0 && 'bg-red-500'
													)}>
														{stream.stats.cc_error}
													</div>
												</div>
											</td>
											<td>
												<div className={`flex`}>
													<div className={cn(
														`py-1 px-2 rounded text-sm`,
														stream.stats.sc_error !== 0 && 'bg-red-500'
													)}>
														{stream.stats.sc_error}
													</div>
												</div>
											</td>
											<td>
												<div className={`flex`}>
													<div className={cn(
														`py-1 px-2 rounded text-sm`,
														stream.stats.sync_error !== 0 && 'bg-red-500'
													)}>
														{stream.stats.sync_error}
													</div>
												</div>
											</td>
											<td>
												<div className={`flex`}>
													<div className={cn(
														`py-1 px-2 rounded text-sm`,
														stream.stats.audio_count === 0 && 'bg-red-500'
													)}>
														{stream.stats.audio_count}
													</div>
												</div>
											</td>
											<td>
												<div className={`flex`}>
													<div className={cn(
														`py-1 px-2 rounded text-sm`,
														stream.stats.video_count === 0 && 'bg-red-500'
													)}>
														{stream.stats.video_count}
													</div>
												</div>
											</td>
											<td>{stream.stats.sessions}</td>
										</>
									) : (
										<>
											<td></td>
											<td></td>
											<td></td>
											<td></td>
											<td></td>
											<td></td>
											<td></td>
										</>
									)}
									<td>{stream.id}</td>
									<td>{stream.output}</td>
									<td className={`flex py-2`}>
										{stream.stats && (
											<div className={cn(
												`rounded py-1 px-2 text-sm`,
												stream.stats.bitrate < 200 ? 'bg-red-500' : (
													stream.stats.bitrate < 600 ? 'bg-yellow-500' : 'bg-green-500'
												)
											)}>
												{stream.stats ? `${stream.stats?.bitrate} Kbit/s` : ''}
											</div>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			<div className={`flex items-center px-8 pb-8 text-xs italic space-x-4`}>
				<p>Version: {checkUpdateResponse?.current_hash || 'loading'}</p>
				{checkUpdateResponse?.update_available && (
					<p>New update available, version {checkUpdateResponse?.newest_hash || 'loading'}</p>
				)}
			</div>
		</>
	)
}