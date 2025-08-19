namespace $ {
	
	const { begin, end, from, line_end, decimal_only, char_any, repeat, repeat_greedy } = $mol_regexp
	
	export let $hd_player_m3u_prolog = from([
		'#EXTM3U',
		repeat_greedy( line_end ),
	])
	
	export let $hd_player_m3u_entry = from([
		'#EXTINF:',
		{ duration: repeat( decimal_only ) },
		',',
		{ title: repeat( char_any ) },
		line_end,
		{ uri: repeat( char_any ) },
		repeat_greedy( line_end, 1 ),
	])
	
	export let $hd_player_m3u = from([
		begin,
		$hd_player_m3u_prolog,
		repeat_greedy( $hd_player_m3u_entry ),
		end,
	])
	
}
